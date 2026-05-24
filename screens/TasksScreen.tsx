import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { palette, cardShadow } from '../lib/designTokens';
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
};

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: palette.neutral,
  in_progress: palette.primary,
  done: palette.success,
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
      return {
        id: String(r.id),
        title: String(r.title ?? ''),
        description: (r.description as string | null) ?? null,
        status: (r.status as TaskStatus) ?? 'todo',
        assignee_id: assigneeId,
        assignee_name: assigneeId ? memberById.get(assigneeId) ?? null : null,
        deadline: (r.deadline as string | null) ?? null,
        created_at: String(r.created_at ?? ''),
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
      .update({ status: next })
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
        <View style={styles.centered}><ActivityIndicator /></View>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => { setEditingTask(item); setShowCreateModal(true); }}
            >
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.taskTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.cardTopRight}>
                    <TouchableOpacity
                      style={[styles.cycleBtn, { backgroundColor: STATUS_COLOR[item.status] + '22' }]}
                      onPress={() => cycleStatus(item)}
                      hitSlop={{ top: 6, left: 6, bottom: 6, right: 6 }}
                      accessibilityLabel="ステータスを変更"
                    >
                      <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
                        {STATUS_LABEL[item.status]}
                      </Text>
                      <Text style={[styles.cycleArrow, { color: STATUS_COLOR[item.status] }]}>→</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {item.description ? (
                  <Text style={styles.taskDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}
                <View style={styles.cardMeta}>
                  {item.assignee_name && (
                    <Text style={styles.metaText}>👤 {item.assignee_name}</Text>
                  )}
                  {item.deadline && (
                    <Text style={styles.metaText}>📅 {item.deadline.slice(0, 10)}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: palette.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: palette.text },
  headerTeam: { fontSize: 13, color: palette.primary, fontWeight: '600', marginTop: 2 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.bgCard,
  },
  filterBtnActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  filterText: { fontSize: 13, fontWeight: '700', color: palette.textMuted },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: palette.bgCard,
    borderRadius: 16,
    padding: 16,
    ...cardShadow,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  taskTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: palette.text },
  cardTopRight: { flexDirection: 'row', alignItems: 'center' },
  cycleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  cycleArrow: { fontSize: 11, fontWeight: '700' },
  statusText: { fontSize: 11, fontWeight: '700' },
  taskDesc: { fontSize: 13, color: palette.textMuted, lineHeight: 18, marginBottom: 8 },
  cardMeta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaText: { fontSize: 12, color: palette.textSubtle },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: palette.text, marginBottom: 6 },
  emptyHint: { fontSize: 13, color: palette.textMuted, textAlign: 'center' },
});
