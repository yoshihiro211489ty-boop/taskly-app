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

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_WINDOW = 30;
const GRID_COLS = 6; // 6 columns × 5 rows = 30 cells

// ─── Types ────────────────────────────────────────────────────────────────────

type RoutineRow = {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'monthly';
};

type RoutineStat = {
  routine: RoutineRow;
  /** Array of 30 booleans, index 0 = oldest day, index 29 = today */
  days: boolean[];
  completionRate: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns an array of n date strings YYYY-MM-DD, oldest first, ending today. */
function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/** Format YYYY-MM-DD as YYYY/M/D */
function formatDateShort(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${y}/${parseInt(m)}/${parseInt(d)}`;
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

  // Computed once at mount. Using useMemo prevents infinite-loop in useEffect
  // (new array every render → new load fn → useEffect fires every render).
  const lastDays = useMemo(() => getLastNDays(DAYS_WINDOW), []);

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

    // 2. Fetch this user's logs for the last 30 days
    const oldest = lastDays[0];
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
      const days = lastDays.map((d) => doneSet.has(`${routine.id}|${d}`));
      const doneCount = days.filter(Boolean).length;
      const completionRate = Math.round((doneCount / DAYS_WINDOW) * 100);
      return { routine, days, completionRate };
    });

    setStats(result);
  }, [profile, lastDays]);

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
        <Text style={styles.headerSub}>
          {formatDateShort(lastDays[0])} 〜 {formatDateShort(lastDays[lastDays.length - 1])}
        </Text>
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
            <RoutineStatCard stat={item} dates={lastDays} />
          )}
        />
      )}
    </View>
  );
}

// ─── Card sub-component ───────────────────────────────────────────────────────

type CardProps = {
  stat: RoutineStat;
  dates: string[];
};

function RoutineStatCard({ stat, dates }: CardProps) {
  const { routine, days, completionRate } = stat;
  const freqColors = statusColors[routine.frequency];

  // Split 30 days into rows of GRID_COLS (6 cols × 5 rows)
  const rows: Array<{ day: boolean; date: string }[]> = [];
  for (let i = 0; i < days.length; i += GRID_COLS) {
    rows.push(
      days.slice(i, i + GRID_COLS).map((done, j) => ({
        day: done,
        date: dates[i + j],
      }))
    );
  }

  return (
    <View style={styles.card}>
      {/* Top row: title + freq badge + rate */}
      <View style={styles.cardTop}>
        <Text style={styles.routineTitle} numberOfLines={1}>{routine.title}</Text>
        <View style={[styles.freqBadge, { backgroundColor: freqColors.bg, borderColor: freqColors.border }]}>
          <Text style={[styles.freqText, { color: freqColors.text }]}>
            {FREQ_LABEL[routine.frequency] ?? routine.frequency}
          </Text>
        </View>
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

      {/* 6 × 5 dot grid */}
      <View style={styles.grid}>
        {rows.map((row, r) => (
          <View key={r} style={styles.gridRow}>
            {row.map(({ day, date }) => (
              <View key={date} style={styles.cell}>
                <View style={[styles.dot, day ? styles.dotDone : styles.dotEmpty]} />
                <Text style={styles.dotLabel}>{date.slice(8)}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const DOT_SIZE = 14;

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
    fontSize: typography.sizes.xs,
    color: palette.textSubtle,
    fontWeight: '600',
    paddingBottom: 2,
  },

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
  rateText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.textMuted,
    minWidth: 36,
    textAlign: 'right',
  },
  rateTextPerfect: { color: palette.success },
  rateTextZero: { color: palette.neutral },

  // Grid
  grid: {
    gap: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 4,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    marginBottom: 2,
  },
  dotDone: {
    backgroundColor: palette.success,
  },
  dotEmpty: {
    backgroundColor: palette.borderLight,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  dotLabel: {
    fontSize: 9,
    color: palette.textSubtle,
    fontWeight: '500',
  },

  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: palette.text, marginBottom: 6 },
  emptyHint: { fontSize: 13, color: palette.textMuted, textAlign: 'center' },
});
