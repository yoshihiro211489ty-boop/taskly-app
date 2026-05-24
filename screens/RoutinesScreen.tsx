import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootStack';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { palette, cardShadow } from '../lib/designTokens';
import { FAB } from '../components';
import { CreateRoutineModal } from './CreateRoutineModal';

type Routine = {
  id: string;
  title: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'monthly';
  done_today: boolean;
};

const FREQ_LABEL: Record<string, string> = {
  daily: '毎日',
  weekly: '毎週',
  monthly: '毎月',
};

export function RoutinesScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  const load = useCallback(async () => {
    if (!profile?.teamId) return;
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('team_id', profile.teamId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[RoutinesScreen] load error:', error.message);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const ids = (data ?? []).map((r: Record<string, unknown>) => String(r.id));

    // 今日完了済みのルーティンIDを取得
    let doneIds = new Set<string>();
    if (ids.length > 0) {
      const { data: logs } = await supabase
        .from('routine_logs')
        .select('routine_id')
        .eq('user_id', profile.id)
        .eq('done_date', today)
        .in('routine_id', ids);
      doneIds = new Set((logs ?? []).map((l: Record<string, unknown>) => String(l.routine_id)));
    }

    setRoutines(
      (data ?? []).map((r: Record<string, unknown>) => ({
        id: String(r.id),
        title: String(r.title ?? ''),
        description: (r.description as string | null) ?? null,
        frequency: (r.frequency as Routine['frequency']) ?? 'daily',
        done_today: doneIds.has(String(r.id)),
      }))
    );
  }, [profile]);

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

  const handleToggle = async (routine: Routine) => {
    const today = new Date().toISOString().slice(0, 10);
    if (routine.done_today) {
      await supabase
        .from('routine_logs')
        .delete()
        .eq('routine_id', routine.id)
        .eq('user_id', profile!.id)
        .eq('done_date', today);
    } else {
      await supabase.from('routine_logs').insert({
        routine_id: routine.id,
        user_id: profile!.id,
        done_date: today,
      });
    }
    setRoutines((prev) =>
      prev.map((r) =>
        r.id === routine.id ? { ...r, done_today: !r.done_today } : r
      )
    );
  };

  if (!profile) return <View style={styles.centered}><ActivityIndicator /></View>;

  if (!profile.teamId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyEmoji}>👥</Text>
        <Text style={styles.emptyTitle}>チームに参加していません</Text>
        <Text style={styles.emptyHint}>チームを作成するか、招待リンクから参加してください。</Text>
      </View>
    );
  }

  const done = routines.filter((r) => r.done_today).length;
  const total = routines.length;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ルーティン</Text>
        <View style={styles.headerRight}>
          {total > 0 && (
            <Text style={styles.progress}>{done} / {total} 完了</Text>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('RoutineStats')}
            style={styles.statsBtn}
            accessibilityLabel="達成状況を見る"
          >
            <Text style={styles.statsBtnText}>📊</Text>
          </TouchableOpacity>
        </View>
      </View>

      {done === total && total > 0 && (
        <View style={styles.celebration}>
          <Text style={styles.celebrationText}>🎉 今日のルーティン完了！</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}><ActivityIndicator /></View>
      ) : routines.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🔁</Text>
          <Text style={styles.emptyTitle}>ルーティンはありません</Text>
          <Text style={styles.emptyHint}>右下の＋ボタンから追加できます</Text>
        </View>
      ) : (
        <FlatList
          data={routines}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListFooterComponent={
            <Text style={styles.editHint}>長押しで編集</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, item.done_today && styles.cardDone]}
              onPress={() => handleToggle(item)}
              onLongPress={() => { setEditingRoutine(item); setShowCreateModal(true); }}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, item.done_today && styles.checkboxDone]}>
                {item.done_today && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.routineTitle, item.done_today && styles.routineTitleDone]}>
                  {item.title}
                </Text>
                {item.description ? (
                  <Text style={styles.routineDesc} numberOfLines={1}>{item.description}</Text>
                ) : null}
                <View style={styles.freqBadge}>
                  <Text style={styles.freqText}>{FREQ_LABEL[item.frequency] ?? item.frequency}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <FAB onPress={() => { setEditingRoutine(null); setShowCreateModal(true); }} />

      <CreateRoutineModal
        visible={showCreateModal}
        teamId={profile.teamId!}
        routine={editingRoutine}
        onClose={() => setShowCreateModal(false)}
        onSaved={load}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bgPage },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: palette.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: palette.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progress: { fontSize: 13, color: palette.success, fontWeight: '700' },
  statsBtn: { padding: 4 },
  statsBtnText: { fontSize: 20 },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  card: {
    backgroundColor: palette.bgCard,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...cardShadow,
  },
  cardDone: { opacity: 0.65 },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: palette.success,
    borderColor: palette.success,
  },
  checkmark: { color: '#fff', fontSize: 16, fontWeight: '900' },
  cardBody: { flex: 1 },
  routineTitle: { fontSize: 15, fontWeight: '700', color: palette.text, marginBottom: 2 },
  routineTitleDone: { textDecorationLine: 'line-through', color: palette.textSubtle },
  routineDesc: { fontSize: 12, color: palette.textMuted, marginBottom: 6 },
  freqBadge: {
    alignSelf: 'flex-start',
    backgroundColor: palette.bgSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  freqText: { fontSize: 11, color: palette.primary, fontWeight: '700' },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: palette.text, marginBottom: 6 },
  emptyHint: { fontSize: 13, color: palette.textMuted, textAlign: 'center' },
  celebration: {
    backgroundColor: palette.successBg,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: palette.successBorder,
    alignItems: 'center',
  },
  celebrationText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.success,
  },
  editHint: {
    textAlign: 'center',
    fontSize: 11,
    color: palette.textSubtle,
    paddingVertical: 8,
    paddingBottom: 80,
  },
});
