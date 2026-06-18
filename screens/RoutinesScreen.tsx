import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Pressable,
  Alert,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../navigation/RootStack';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import {
  palette,
  statusColors,
  shadows,
  spacing,
  typography,
  radii,
  motion,
} from '../lib/designTokens';
import { FAB } from '../components';
import { CreateRoutineModal } from './CreateRoutineModal';
import { usePremium, FREE_LIMITS } from '../lib/billing';

type Routine = {
  id: string;
  title: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'monthly';
  done_today: boolean;
};

const FREQ_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  daily:   statusColors.daily,
  weekly:  statusColors.weekly,
  monthly: statusColors.monthly,
};

// ─── Spring checkbox ──────────────────────────────────────────────────────────
function SpringCheckbox({ done }: { done: boolean }) {
  const scale = useSharedValue(1);
  const prevDone = useRef(done);

  if (prevDone.current !== done) {
    prevDone.current = done;
    if (done) {
      scale.value = withSequence(
        withSpring(1.35, motion.bounce),
        withSpring(1, motion.snap),
      );
    }
  }

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.checkbox, done && styles.checkboxDone, animStyle]}>
      {done && <Text style={styles.checkmark}>✓</Text>}
    </Animated.View>
  );
}

export function RoutinesScreen() {
  const { t } = useTranslation();
  const FREQ_LABEL: Record<string, string> = {
    daily: t('routines.freq_daily'),
    weekly: t('routines.freq_weekly'),
    monthly: t('routines.freq_monthly'),
  };
  const { profile } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isPremium } = usePremium();
  const [routines, setRoutines] = useState<Routine[]>([]);

  const handleFABPress = () => {
    if (!isPremium && routines.length >= FREE_LIMITS.maxRoutines) {
      Alert.alert(
        '⭐ ルーティン上限に達しました',
        `無料プランはルーティン${FREE_LIMITS.maxRoutines}件まで。プレミアムにアップグレードすると無制限になります。`,
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: 'アップグレード', onPress: () => navigation.navigate('Premium') },
        ]
      );
      return;
    }
    setEditingRoutine(null);
    setShowCreateModal(true);
  };
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
        <Text style={styles.emptyTitle}>{t('team.no_team_title')}</Text>
        <Text style={styles.emptyHint}>{t('team.no_team_hint')}</Text>
      </View>
    );
  }

  const done = routines.filter((r) => r.done_today).length;
  const total = routines.length;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('routines.title')}</Text>
        <View style={styles.headerRight}>
          {total > 0 && (
            <Text style={styles.progress}>{t('routines.progress', { done, total })}</Text>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('RoutineStats')}
            style={styles.statsBtn}
            accessibilityLabel={t('routines.stats_title')}
          >
            <Text style={styles.statsBtnText}>📊</Text>
          </TouchableOpacity>
        </View>
      </View>

      {done === total && total > 0 && (
        <View style={styles.celebration}>
          <Text style={styles.celebrationText}>{t('routines.all_done')}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}><ActivityIndicator /></View>
      ) : routines.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🔁</Text>
          <Text style={styles.emptyTitle}>{t('routines.empty_title')}</Text>
          <Text style={styles.emptyHint}>{t('routines.empty_hint')}</Text>
        </View>
      ) : (
        <FlatList
          data={routines}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListFooterComponent={
            <Text style={styles.editHint}>{t('routines.long_press_hint')}</Text>
          }
          renderItem={({ item }) => {
            const fc = FREQ_COLORS[item.frequency];
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.card,
                  item.done_today && styles.cardDone,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => handleToggle(item)}
                onLongPress={() => { setEditingRoutine(item); setShowCreateModal(true); }}
              >
                <SpringCheckbox done={item.done_today} />
                <View style={styles.cardBody}>
                  <Text style={[styles.routineTitle, item.done_today && styles.routineTitleDone]}>
                    {item.title}
                  </Text>
                  {item.description ? (
                    <Text style={styles.routineDesc} numberOfLines={1}>{item.description}</Text>
                  ) : null}
                  {fc ? (
                    <View style={[styles.freqBadge, { backgroundColor: fc.bg, borderColor: fc.border }]}>
                      <Text style={[styles.freqText, { color: fc.text }]}>
                        {FREQ_LABEL[item.frequency] ?? item.frequency}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <FAB onPress={handleFABPress} />

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

  // Header
  header: {
    paddingHorizontal: spacing['5'],
    paddingTop: 56,
    paddingBottom: spacing['3'],
    backgroundColor: palette.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.black,
    color: palette.text,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing['2'] },
  progress: {
    fontSize: typography.sizes.sm,
    color: palette.success,
    fontWeight: typography.weights.bold,
  },
  statsBtn: { padding: 4 },
  statsBtnText: { fontSize: 20 },

  // List
  list: { padding: spacing['4'], gap: spacing['3'], paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: palette.bgCard,
    borderRadius: radii.xl,
    padding: spacing['4'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3'],
    ...shadows.sm,
  },
  cardDone: { opacity: 0.6 },
  cardPressed: { opacity: 0.8 },

  // Checkbox
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.bgPage,
  },
  checkboxDone: {
    backgroundColor: palette.success,
    borderColor: palette.success,
  },
  checkmark: {
    color: palette.onInverse,
    fontSize: 16,
    fontWeight: typography.weights.black,
  },

  // Card body
  cardBody: { flex: 1 },
  routineTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: palette.text,
    marginBottom: 2,
  },
  routineTitleDone: {
    textDecorationLine: 'line-through',
    color: palette.textSubtle,
  },
  routineDesc: {
    fontSize: typography.sizes.xs,
    color: palette.textMuted,
    marginBottom: spacing['2'],
  },
  freqBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing['2'],
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  freqText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },

  // Empty
  emptyEmoji: { fontSize: 40, marginBottom: spacing['3'] },
  emptyTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: palette.text,
    marginBottom: spacing['2'],
  },
  emptyHint: { fontSize: typography.sizes.sm, color: palette.textMuted, textAlign: 'center' },

  // Celebration
  celebration: {
    backgroundColor: palette.accentMuted,
    paddingVertical: 10,
    paddingHorizontal: spacing['5'],
    borderBottomWidth: 1,
    borderBottomColor: palette.accent + '40',
    alignItems: 'center',
  },
  celebrationText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: palette.accent,
  },

  // Edit hint
  editHint: {
    textAlign: 'center',
    fontSize: typography.sizes.xs,
    color: palette.textSubtle,
    paddingVertical: spacing['2'],
    paddingBottom: 80,
  },
});
