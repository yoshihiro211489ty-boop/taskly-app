import { useCallback, useEffect, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import {
  palette,
  statusColors,
  shadows,
  spacing,
  typography,
  radii,
} from '../lib/designTokens';
import { formatRelativeTime } from '../lib/time';
import { FAB } from '../components';
import { CreateTaskModal } from './CreateTaskModal';

type TaskStatus = 'todo' | 'in_progress' | 'done';

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee_id: string | null;
  assignee_name: string | null;
  deadline: string | null;
  created_at: string;
  /** Populated after §3 DB migration */
  updated_by: string | null;
  updated_by_name: string | null;
  updated_at: string;
};

const STATUS_COLORS_MAP: Record<TaskStatus, { bg: string; text: string; border: string }> = {
  todo:        statusColors.todo,
  in_progress: statusColors.inProgress,
  done:        statusColors.done,
};

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
};

export function TasksScreen() {
  const { t } = useTranslation();
  const STATUS_LABEL: Record<TaskStatus, string> = {
    todo: t('tasks.status_todo'),
    in_progress: t('tasks.status_in_progress'),
    done: t('tasks.status_done'),
  };
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine'>('mine');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const load = useCallback(async () => {
    if (!profile?.teamId) return;

    // 担当者名は別クエリで取得しクライアント側で結合する
    // （tasks ↔ profiles は assignee_id と created_by 等で複数FKがあるため
    //  PostgREST の `.select('*, profiles(name)')` だと 300 Multiple Choices になる）
    const [tasksRes, membersRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('team_id', profile.teamId)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, name')
        .eq('team_id', profile.teamId),
    ]);

    if (tasksRes.error) {
      console.warn('[TasksScreen] tasks load error:', tasksRes.error.message);
      return;
    }
    if (membersRes.error) {
      console.warn('[TasksScreen] members load error:', membersRes.error.message);
    }

    const members = (membersRes.data ?? []).map((m: Record<string, unknown>) => ({
      id: String(m.id),
      name: String(m.name ?? ''),
    }));
    const memberById = new Map(members.map((m) => [m.id, m.name] as const));

    const rows: Task[] = (tasksRes.data ?? []).map((r: Record<string, unknown>) => {
      const assigneeId = (r.assignee_id as string | null) ?? null;
      const updatedById = (r.updated_by as string | null) ?? null;
      return {
        id: String(r.id),
        title: String(r.title ?? ''),
        description: (r.description as string | null) ?? null,
        status: (r.status as TaskStatus) ?? 'todo',
        assignee_id: assigneeId,
        assignee_name: assigneeId ? (memberById.get(assigneeId) ?? null) : null,
        deadline: (r.deadline as string | null) ?? null,
        created_at: String(r.created_at ?? ''),
        updated_by: updatedById,
        updated_by_name: updatedById ? (memberById.get(updatedById) ?? null) : null,
        updated_at: String(r.updated_at ?? r.created_at ?? ''),
      };
    });

    setTasks(rows);
    setTeamMembers(members);
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

  const cycleStatus = async (item: Task) => {
    const next = STATUS_CYCLE[item.status];
    const { error } = await supabase
      .from('tasks')
      .update({ status: next, updated_by: profile?.id ?? null })
      .eq('id', item.id);
    if (error) {
      Alert.alert('エラー', error.message);
      return;
    }
    await load();
  };

  const filteredTasks = filter === 'mine'
    ? tasks.filter((t) => t.assignee_id === profile?.id)
    : tasks;

  if (!profile) {
    return <View style={styles.centered}><ActivityIndicator /></View>;
  }

  if (!profile.teamId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyEmoji}>👥</Text>
        <Text style={styles.emptyTitle}>{t('team.no_team_title')}</Text>
        <Text style={styles.emptyHint}>{t('team.no_team_hint')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('tasks.title')}</Text>
        {profile.teamName && (
          <Text style={styles.headerTeam}>{profile.teamName}</Text>
        )}
      </View>

      <View style={styles.filterRow}>
        {(['mine', 'all'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'mine' ? t('tasks.my_tasks') : t('tasks.all_team')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={palette.primary} /></View>
      ) : filteredTasks.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>{t('tasks.empty_title')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
          renderItem={({ item }) => {
            const sc = STATUS_COLORS_MAP[item.status];
            return (
              <Pressable
                onPress={() => { setEditingTask(item); setShowCreateModal(true); }}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                {/* Left accent bar */}
                <View style={[styles.cardAccent, { backgroundColor: sc.text }]} />
                <View style={styles.cardContent}>
                  <View style={styles.cardTop}>
                    <Text style={styles.taskTitle} numberOfLines={2}>{item.title}</Text>
                    <TouchableOpacity
                      style={[styles.cycleBtn, { backgroundColor: sc.bg, borderColor: sc.border }]}
                      onPress={() => cycleStatus(item)}
                      hitSlop={{ top: 6, left: 6, bottom: 6, right: 6 }}
                      accessibilityLabel="ステータスを変更"
                    >
                      <Text style={[styles.statusText, { color: sc.text }]}>
                        {STATUS_LABEL[item.status]}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {item.description ? (
                    <Text style={styles.taskDesc} numberOfLines={2}>{item.description}</Text>
                  ) : null}
                  <View style={styles.cardMeta}>
                    {item.assignee_name && (
                      <Text style={styles.metaChip}>👤 {item.assignee_name}</Text>
                    )}
                    {item.deadline && (
                      <Text style={styles.metaChip}>📅 {item.deadline.slice(0, 10)}</Text>
                    )}
                    {item.updated_by_name && (
                      <Text style={styles.metaChip}>
                        ✏️ {item.updated_by_name} · {formatRelativeTime(item.updated_at)}
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {profile.teamId && (
        <FAB onPress={() => { setEditingTask(null); setShowCreateModal(true); }} />
      )}

      <CreateTaskModal
        visible={showCreateModal}
        teamId={profile.teamId}
        task={editingTask}
        teamMembers={teamMembers}
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
  },
  headerTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.black,
    color: palette.text,
  },
  headerTeam: {
    fontSize: typography.sizes.sm,
    color: palette.primary,
    fontWeight: typography.weights.semibold,
    marginTop: 2,
  },

  // Filter
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['2'],
    gap: spacing['2'],
    backgroundColor: palette.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.full,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: palette.borderLight,
    backgroundColor: palette.bgPage,
  },
  filterBtnActive: {
    backgroundColor: palette.primaryMuted,
    borderColor: palette.primary,
  },
  filterText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: palette.textMuted,
  },
  filterTextActive: { color: palette.primary },

  // List
  list: { padding: spacing['4'], gap: spacing['3'], paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: palette.bgCard,
    borderRadius: radii.xl,
    overflow: 'hidden',
    flexDirection: 'row',
    ...shadows.sm,
  },
  cardPressed: { opacity: 0.85 },
  cardAccent: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: spacing['4'],
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing['2'],
    marginBottom: spacing['1'],
  },
  taskTitle: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: palette.text,
    lineHeight: typography.sizes.base * 1.4,
  },
  cycleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  taskDesc: {
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    lineHeight: typography.sizes.sm * 1.5,
    marginBottom: spacing['2'],
  },
  cardMeta: { flexDirection: 'row', gap: spacing['3'], flexWrap: 'wrap', marginTop: 4 },
  metaChip: { fontSize: typography.sizes.xs, color: palette.textSubtle },

  // Empty
  emptyEmoji: { fontSize: 40, marginBottom: spacing['3'] },
  emptyTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: palette.text,
    marginBottom: spacing['2'],
  },
  emptyHint: { fontSize: typography.sizes.sm, color: palette.textMuted, textAlign: 'center' },
});
