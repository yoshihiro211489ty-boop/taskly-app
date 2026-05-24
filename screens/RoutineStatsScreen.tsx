import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { palette, cardShadow, typography, spacing, radii, statusColors } from '../lib/designTokens';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_WINDOW = 30;
const GRID_COLS = 6; // 6 columns × 5 rows = 30 cells

const MEMBER_COL_W = 96;
const RATE_COL_W = 68;

// ─── Types ────────────────────────────────────────────────────────────────────

type RoutineRow = {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'monthly';
};

type RoutineStat = {
  routine: RoutineRow;
  /** 30 booleans; index 0 = oldest, index 29 = today */
  days: boolean[];
  completionRate: number;
};

type CellData = {
  routineId: string;
  routineTitle: string;
  rate: number;
  days: boolean[];
};

type MemberRate = {
  memberId: string;
  memberName: string;
  cells: CellData[];
};

type TeamStats = {
  routines: RoutineRow[];
  matrix: MemberRate[];
};

type DetailState = {
  memberName: string;
  routineTitle: string;
  days: boolean[];
  rate: number;
} | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function formatDateShort(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${y}/${parseInt(m)}/${parseInt(d)}`;
}

const FREQ_LABEL: Record<string, string> = {
  daily: '毎日',
  weekly: '毎週',
  monthly: '毎月',
};

/** Background fill for matrix rate cells */
function rateBg(rate: number): string {
  if (rate === 0) return '#F1F5F9';
  if (rate < 50) return '#FEF3C7';
  if (rate < 80) return '#D1FAE5';
  return '#A7F3D0';
}
/** Text color for matrix rate cells */
function rateTextClr(rate: number): string {
  if (rate === 0) return palette.textSubtle;
  if (rate < 50) return '#92400E';
  return '#065F46';
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RoutineStatsScreen() {
  const { profile } = useAuth();

  const [tab, setTab] = useState<'mine' | 'team'>('mine');

  // Mine tab
  const [stats, setStats] = useState<RoutineStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Team tab
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);

  // Detail modal (team cell drill-down)
  const [detail, setDetail] = useState<DetailState>(null);

  // Computed once at mount — useMemo prevents infinite-loop in useEffect
  const lastDays = useMemo(() => getLastNDays(DAYS_WINDOW), []);

  // ── Mine load ──────────────────────────────────────────────────────────────

  const loadMine = useCallback(async () => {
    if (!profile?.teamId || !profile?.id) return;

    const { data: routinesData, error: routinesError } = await supabase
      .from('routines')
      .select('id, title, frequency')
      .eq('team_id', profile.teamId)
      .order('created_at', { ascending: true });

    if (routinesError) {
      console.warn('[RoutineStats/mine] routines:', routinesError.message);
      return;
    }

    const routines: RoutineRow[] = (routinesData ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      title: String(r.title ?? ''),
      frequency: (r.frequency as RoutineRow['frequency']) ?? 'daily',
    }));

    if (routines.length === 0) { setStats([]); return; }

    const { data: logsData, error: logsError } = await supabase
      .from('routine_logs')
      .select('routine_id, done_date')
      .eq('user_id', profile.id)
      .gte('done_date', lastDays[0])
      .in('routine_id', routines.map((r) => r.id));

    if (logsError) {
      console.warn('[RoutineStats/mine] logs:', logsError.message);
      return;
    }

    const doneSet = new Set<string>(
      (logsData ?? []).map((l: Record<string, unknown>) =>
        `${String(l.routine_id)}|${String(l.done_date)}`
      )
    );

    setStats(routines.map((routine) => {
      const days = lastDays.map((d) => doneSet.has(`${routine.id}|${d}`));
      return {
        routine,
        days,
        completionRate: Math.round((days.filter(Boolean).length / DAYS_WINDOW) * 100),
      };
    }));
  }, [profile, lastDays]);

  // ── Team load ──────────────────────────────────────────────────────────────

  const loadTeam = useCallback(async () => {
    if (!profile?.teamId) return;
    setTeamLoading(true);

    const [membersRes, routinesRes, logsRes] = await Promise.all([
      supabase.from('profiles').select('id, name').eq('team_id', profile.teamId),
      supabase.from('routines').select('id, title, frequency')
        .eq('team_id', profile.teamId).order('created_at'),
      // After RLS migration, this returns logs for the whole team
      supabase.from('routine_logs').select('routine_id, user_id, done_date')
        .gte('done_date', lastDays[0]),
    ]);

    if (membersRes.error)  console.warn('[RoutineStats/team] members:', membersRes.error.message);
    if (routinesRes.error) console.warn('[RoutineStats/team] routines:', routinesRes.error.message);
    if (logsRes.error)     console.warn('[RoutineStats/team] logs:', logsRes.error.message);

    const routines: RoutineRow[] = (routinesRes.data ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      title: String(r.title ?? ''),
      frequency: (r.frequency as RoutineRow['frequency']) ?? 'daily',
    }));

    const doneKey = (uid: string, rid: string, date: string) => `${uid}|${rid}|${date}`;
    const doneSet = new Set<string>(
      (logsRes.data ?? []).map((l: Record<string, unknown>) =>
        doneKey(String(l.user_id), String(l.routine_id), String(l.done_date))
      )
    );

    const matrix: MemberRate[] = (membersRes.data ?? []).map((m: Record<string, unknown>) => {
      const mId = String(m.id);
      return {
        memberId: mId,
        memberName: String(m.name ?? '名前未設定'),
        cells: routines.map((r) => {
          const days = lastDays.map((d) => doneSet.has(doneKey(mId, r.id, d)));
          return {
            routineId: r.id,
            routineTitle: r.title,
            rate: Math.round((days.filter(Boolean).length / DAYS_WINDOW) * 100),
            days,
          };
        }),
      };
    });

    setTeamStats({ routines, matrix });
    setTeamLoading(false);
  }, [profile, lastDays]);

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadMine();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [loadMine]);

  useEffect(() => {
    if (tab === 'team' && teamStats === null && !teamLoading) {
      loadTeam();
    }
  }, [tab, teamStats, teamLoading, loadTeam]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (tab === 'mine') {
      await loadMine();
    } else {
      setTeamStats(null);
      await loadTeam();
    }
    setRefreshing(false);
  };

  // ── Render guards ──────────────────────────────────────────────────────────

  if (!profile) {
    return <View style={styles.centered}><ActivityIndicator /></View>;
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>達成状況</Text>
        <Text style={styles.headerSub}>
          {formatDateShort(lastDays[0])} 〜 {formatDateShort(lastDays[lastDays.length - 1])}
        </Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['mine', 'team'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === 'mine' ? '自分' : 'チーム全体'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mine tab */}
      {tab === 'mine' && (
        loading ? (
          <View style={styles.centered}><ActivityIndicator /></View>
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
            renderItem={({ item }) => <RoutineStatCard stat={item} dates={lastDays} />}
          />
        )
      )}

      {/* Team tab */}
      {tab === 'team' && (
        teamLoading ? (
          <View style={styles.centered}><ActivityIndicator /></View>
        ) : !teamStats || teamStats.matrix.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyTitle}>データがありません</Text>
            <Text style={styles.emptyHint}>
              チームメンバーのルーティン記録がまだありません。{'\n'}
              ※ DBマイグレーション適用後に表示されます。
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.teamContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <TeamMatrix
              stats={teamStats}
              currentUserId={profile.id}
              onCellPress={(memberName, cell) =>
                setDetail({ memberName, routineTitle: cell.routineTitle, days: cell.days, rate: cell.rate })
              }
            />
          </ScrollView>
        )
      )}

      {/* Detail modal */}
      {detail && (
        <DetailDotModal
          data={detail}
          dates={lastDays}
          onClose={() => setDetail(null)}
        />
      )}
    </View>
  );
}

// ─── Mine: RoutineStatCard ────────────────────────────────────────────────────

type CardProps = { stat: RoutineStat; dates: string[] };

function RoutineStatCard({ stat, dates }: CardProps) {
  const { routine, days, completionRate } = stat;
  const freqColors = statusColors[routine.frequency];

  const rows: Array<{ done: boolean; date: string }[]> = [];
  for (let i = 0; i < days.length; i += GRID_COLS) {
    rows.push(
      days.slice(i, i + GRID_COLS).map((done, j) => ({ done, date: dates[i + j] }))
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.routineTitle} numberOfLines={1}>{routine.title}</Text>
        <View style={[styles.freqBadge, { backgroundColor: freqColors.bg, borderColor: freqColors.border }]}>
          <Text style={[styles.freqText, { color: freqColors.text }]}>
            {FREQ_LABEL[routine.frequency] ?? routine.frequency}
          </Text>
        </View>
        <Text style={[
          styles.rateLabel,
          completionRate === 100 && styles.rateLabelPerfect,
          completionRate === 0 && styles.rateLabelZero,
        ]}>
          {completionRate}%
        </Text>
      </View>
      <DotGrid rows={rows} />
    </View>
  );
}

// ─── Shared: DotGrid ─────────────────────────────────────────────────────────

type GridRow = { done: boolean; date: string }[];

function DotGrid({ rows }: { rows: GridRow[] }) {
  return (
    <View style={styles.grid}>
      {rows.map((row, r) => (
        <View key={r} style={styles.gridRow}>
          {row.map(({ done, date }) => (
            <View key={date} style={styles.cell}>
              <View style={[styles.dot, done ? styles.dotDone : styles.dotEmpty]} />
              <Text style={styles.dotLabel}>{date.slice(8)}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── Team: Matrix ─────────────────────────────────────────────────────────────

type MatrixProps = {
  stats: TeamStats;
  currentUserId: string;
  onCellPress: (memberName: string, cell: CellData) => void;
};

function TeamMatrix({ stats, currentUserId, onCellPress }: MatrixProps) {
  const { routines, matrix } = stats;

  return (
    <View style={styles.matrixWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
        <View>
          {/* Header row */}
          <View style={styles.matrixHeaderRow}>
            <View style={{ width: MEMBER_COL_W }} />
            {routines.map((r) => (
              <View key={r.id} style={styles.matrixHeaderCell}>
                <Text style={styles.matrixHeaderText} numberOfLines={2}>{r.title}</Text>
              </View>
            ))}
          </View>

          {/* Member rows */}
          {matrix.map((member, idx) => (
            <View
              key={member.memberId}
              style={[styles.matrixRow, idx % 2 === 1 && styles.matrixRowAlt]}
            >
              <View style={styles.matrixMemberCell}>
                <Text style={styles.matrixMemberText} numberOfLines={1}>
                  {member.memberName}
                  {member.memberId === currentUserId ? ' 👤' : ''}
                </Text>
              </View>
              {member.cells.map((cell) => (
                <TouchableOpacity
                  key={cell.routineId}
                  style={[styles.matrixRateCell, { backgroundColor: rateBg(cell.rate) }]}
                  onPress={() => onCellPress(member.memberName, cell)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.matrixRateText, { color: rateTextClr(cell.rate) }]}>
                    {cell.rate}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { label: '0%',    bg: '#F1F5F9', text: palette.textSubtle },
          { label: '1–49%', bg: '#FEF3C7', text: '#92400E' },
          { label: '50–79%',bg: '#D1FAE5', text: '#065F46' },
          { label: '80%+',  bg: '#A7F3D0', text: '#065F46' },
        ].map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.bg, borderColor: palette.border }]} />
            <Text style={[styles.legendText, { color: item.text }]}>{item.label}</Text>
          </View>
        ))}
        <Text style={styles.legendHint}>セルをタップで詳細</Text>
      </View>
    </View>
  );
}

// ─── Team: Detail modal ───────────────────────────────────────────────────────

type DetailProps = {
  data: NonNullable<DetailState>;
  dates: string[];
  onClose: () => void;
};

function DetailDotModal({ data, dates, onClose }: DetailProps) {
  const rows: GridRow[] = [];
  for (let i = 0; i < data.days.length; i += GRID_COLS) {
    rows.push(
      data.days.slice(i, i + GRID_COLS).map((done, j) => ({ done, date: dates[i + j] }))
    );
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
          {/* Member + routine */}
          <Text style={styles.modalMember}>{data.memberName}</Text>
          <Text style={styles.modalRoutine}>{data.routineTitle}</Text>

          {/* Rate badge */}
          <View style={[styles.modalRateBadge, { backgroundColor: rateBg(data.rate) }]}>
            <Text style={[styles.modalRateText, { color: rateTextClr(data.rate) }]}>
              達成率 {data.rate}%
            </Text>
          </View>

          {/* 6×5 grid */}
          <DotGrid rows={rows} />

          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.modalCloseBtnText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const DOT_SIZE = 14;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bgPage },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  // Header
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

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: palette.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
    paddingHorizontal: spacing['4'],
    paddingBottom: 0,
    gap: spacing['1'],
  },
  tabBtn: {
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: palette.primary,
  },
  tabBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: palette.textMuted,
  },
  tabBtnTextActive: {
    color: palette.primary,
  },

  // Mine: list
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
  freqText: { fontSize: typography.sizes.xs, fontWeight: '700' },
  rateLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.textMuted,
    minWidth: 36,
    textAlign: 'right',
  },
  rateLabelPerfect: { color: palette.success },
  rateLabelZero: { color: palette.neutral },

  // Shared: DotGrid
  grid: { gap: 4 },
  gridRow: { flexDirection: 'row', gap: 4 },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    marginBottom: 2,
  },
  dotDone: { backgroundColor: palette.success },
  dotEmpty: {
    backgroundColor: palette.borderLight,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  dotLabel: { fontSize: 9, color: palette.textSubtle, fontWeight: '500' },

  // Team: matrix
  teamContainer: { padding: spacing['4'], paddingBottom: 40 },
  matrixWrapper: {
    backgroundColor: palette.bgCard,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...cardShadow,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    backgroundColor: palette.bgSubtle,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
  },
  matrixHeaderCell: {
    width: RATE_COL_W,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderLeftWidth: 1,
    borderLeftColor: palette.borderLight,
  },
  matrixHeaderText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.textMuted,
    textAlign: 'center',
  },
  matrixRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
  },
  matrixRowAlt: { backgroundColor: '#FAFBFD' },
  matrixMemberCell: {
    width: MEMBER_COL_W,
    padding: 10,
    justifyContent: 'center',
  },
  matrixMemberText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: palette.text,
  },
  matrixRateCell: {
    width: RATE_COL_W,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: palette.borderLight,
  },
  matrixRateText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },

  // Team: legend
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing['3'],
    padding: spacing['3'],
    borderTopWidth: 1,
    borderTopColor: palette.borderLight,
    backgroundColor: palette.bgCard,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
  },
  legendText: { fontSize: 11, fontWeight: '600' },
  legendHint: {
    fontSize: 11,
    color: palette.textSubtle,
    marginLeft: 'auto',
  },

  // Detail modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(22, 32, 51, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['6'],
  },
  modalSheet: {
    width: '100%',
    backgroundColor: palette.bgCard,
    borderRadius: radii.xl,
    padding: spacing['5'],
    gap: spacing['3'],
    ...cardShadow,
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  modalMember: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: palette.text,
  },
  modalRoutine: {
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    marginTop: -spacing['2'],
  },
  modalRateBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing['3'],
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  modalRateText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  modalCloseBtn: {
    backgroundColor: palette.bgSubtle,
    borderRadius: radii.lg,
    paddingVertical: spacing['3'],
    alignItems: 'center',
    marginTop: spacing['1'],
  },
  modalCloseBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: palette.primary,
  },

  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: palette.text, marginBottom: 6 },
  emptyHint: { fontSize: 13, color: palette.textMuted, textAlign: 'center', lineHeight: 20 },
});
