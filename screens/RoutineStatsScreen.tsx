import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { palette, cardShadow, typography, spacing, radii, statusColors } from '../lib/designTokens';

// ─── Types ────────────────────────────────────────────────────────────────────

type RoutineRow = {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'monthly';
};

type RoutineStat = {
  routine: RoutineRow;
  /** Array of 7 booleans, index 0 = oldest day, index 6 = today */
  days: boolean[];
  completionRate: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns an array of 7 date strings YYYY-MM-DD, oldest first, ending today. */
function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/** Short day labels: 月, 火, … */
const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

function getDayLabel(dateStr: string): string {
  return DAY_LABELS[new Date(dateStr).getDay()];
}

const FREQ_LABEL: Record<string, string> = {
  daily: '毎日',
  weekly: '毎週',
  monthly: '毎月',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function RoutineStatsScreen() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<RoutineStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // NOTE: getLast7Days() を render 中に呼んで useCallback の deps に入れると
  //   毎 render で新しい配列 → load 関数が再生成 → useEffect が再実行 → 無限ループ。
  //   マウント時に 1 度だけ算出して固定する。
  const last7Days = useMemo(() => getLast7Days(), []);

  const load = useCallback(async () => {
    if (!profile?.teamId || !profile?.id) return;

    // 1. Fetch all routines for the team
    const { data: routinesData, error: routinesError } = await supabase
      .from('routines')
      .select('id, title, frequency')
      .eq('team_id', profile.teamId)
      .order('created_at', { ascending: true });

    if (routinesError) {
      console.warn('[RoutineStatsScreen] routines fetch error:', routinesError.message);
      return;
    }

    const routines: RoutineRow[] = (routinesData ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      title: String(r.title ?? ''),
      frequency: (r.frequency as RoutineRow['frequency']) ?? 'daily',
    }));

    if (routines.length === 0) {
      setStats([]);
      return;
    }

    // 2. Fetch this user's logs for the last 7 days
    const oldest = last7Days[0];
    const { data: logsData, error: logsError } = await supabase
      .from('routine_logs')
      .select('routine_id, done_date')
      .eq('user_id', profile.id)
      .gte('done_date', oldest)
      .in('routine_id', routines.map((r) => r.id));

    if (logsError) {
      console.warn('[RoutineStatsScreen] logs fetch error:', logsError.message);
      return;
    }

    // Build a set of "routineId|date" for O(1) lookup
    const doneSet = new Set<string>(
      (logsData ?? []).map((l: Record<string, unknown>) =>
        `${String(l.routine_id)}|${String(l.done_date)}`
      )
    );

    // 3. Build stats
    const result: RoutineStat[] = routines.map((routine) => {
      const days = last7Days.map((d) => doneSet.has(`${routine.id}|${d}`));
      const completionRate = Math.round((days.filter(Boolean).length / 7) * 100);
      return { routine, days, completionRate };
    });

    setStats(result);
  }, [profile, last7Days]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!profile.teamId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyEmoji}>👥</Text>
        <Text style={styles.emptyTitle}>チームに参加していません</Text>
        <Text style={styles.emptyHint}>チームを作成するか、招待リンクから参加してください。</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Screen header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>達成状況</Text>
        <Text style={styles.headerSub}>過去7日間</Text>
      </View>

      {/* Day-of-week column headers */}
      <View style={styles.dayHeaderRow}>
        <View style={styles.routineNamePlaceholder} />
        {last7Days.map((d) => (
          <View key={d} style={styles.dayHeaderCell}>
            <Text style={styles.dayHeaderText}>{getDayLabel(d)}</Text>
          </View>
        ))}
        <View style={styles.rateHeaderCell}>
          <Text style={styles.dayHeaderText}>達成率</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : stats.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>ルーティンがありません</Text>
          <Text style={styles.emptyHint}>ルーティンを追加すると達成状況が表示されます。</Text>
        </View>
      ) : (
        <FlatList
          data={stats}
          keyExtractor={(s) => s.routine.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <RoutineStatRow stat={item} dates={last7Days} />
          )}
        />
      )}
    </View>
  );
}

// ─── Row sub-component ────────────────────────────────────────────────────────

type RowProps = {
  stat: RoutineStat;
  dates: string[];
};

function RoutineStatRow({ stat, dates }: RowProps) {
  const { routine, days, completionRate } = stat;
  const freqColors = statusColors[routine.frequency];

  return (
    <View style={styles.card}>
      {/* Routine name + freq badge */}
      <View style={styles.cardTop}>
        <Text style={styles.routineTitle} numberOfLines={1}>{routine.title}</Text>
        <View style={[styles.freqBadge, { backgroundColor: freqColors.bg, borderColor: freqColors.border }]}>
          <Text style={[styles.freqText, { color: freqColors.text }]}>
            {FREQ_LABEL[routine.frequency] ?? routine.frequency}
          </Text>
        </View>
      </View>

      {/* Dot grid + completion rate */}
      <View style={styles.dotRow}>
        {days.map((done, i) => (
          <View key={dates[i]} style={styles.dotCell}>
            <View style={[styles.dot, done ? styles.dotDone : styles.dotEmpty]} />
            <Text style={styles.dotDate}>{dates[i].slice(8)}</Text>
          </View>
        ))}
        <View style={styles.rateCell}>
          <Text
            style={[
              styles.rateText,
              completionRate === 100 && styles.rateTextPerfect,
              completionRate === 0 && styles.rateTextZero,
            ]}
          >
            {completionRate}%
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const DOT_SIZE = 18;
const CELL_WIDTH = 32;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bgPage },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  header: {
    paddingHorizontal: spacing['5'],
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: palette.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '900',
    color: palette.text,
  },
  headerSub: {
    fontSize: typography.sizes.sm,
    color: palette.textSubtle,
    fontWeight: '600',
    paddingBottom: 2,
  },

  // Column headers
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['2'],
    backgroundColor: palette.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
  },
  routineNamePlaceholder: { flex: 1 },
  dayHeaderCell: { width: CELL_WIDTH, alignItems: 'center' },
  dayHeaderText: {
    fontSize: typography.sizes.xs,
    color: palette.textSubtle,
    fontWeight: '600',
  },
  rateHeaderCell: { width: 44, alignItems: 'center' },

  list: { padding: spacing['4'], gap: spacing['3'], paddingBottom: 40 },

  card: {
    backgroundColor: palette.bgCard,
    borderRadius: radii.lg,
    padding: spacing['4'],
    ...cardShadow,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['3'],
    gap: spacing['2'],
  },
  routineTitle: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.text,
  },
  freqBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  freqText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },

  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotCell: {
    width: CELL_WIDTH,
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  dotDone: {
    backgroundColor: palette.success,
  },
  dotEmpty: {
    backgroundColor: palette.borderLight,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  dotDate: {
    fontSize: 9,
    color: palette.textSubtle,
    fontWeight: '500',
  },
  rateCell: {
    width: 44,
    alignItems: 'center',
  },
  rateText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.textMuted,
  },
  rateTextPerfect: {
    color: palette.success,
  },
  rateTextZero: {
    color: palette.neutral,
  },

  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: palette.text, marginBottom: 6 },
  emptyHint: { fontSize: 13, color: palette.textMuted, textAlign: 'center' },
});
