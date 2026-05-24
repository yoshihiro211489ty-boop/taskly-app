/**
 * TaskDetailScreen
 *
 * Read-only detail view for a single task.
 * Designed for a future React Navigation stack — accepts `navigation` and
 * `route` props matching the RootStackParamList below.
 *
 * Usage (once a stack navigator is wired up):
 *   navigation.navigate('TaskDetail', { task, teamMembers })
 */

import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import {
  palette,
  cardShadow,
  typography,
  spacing,
  radii,
} from '../lib/designTokens';
import { Avatar, Badge } from '../components';
import { CreateTaskModal, type Task } from './CreateTaskModal';

// ─── Navigation types ─────────────────────────────────────────────────────────

export type RootStackParamList = {
  TaskDetail: {
    task: Task;
    teamMembers: { id: string; name: string }[];
    teamId: string;
  };
};

type Props = {
  navigation: NavigationProp<RootStackParamList, 'TaskDetail'>;
  route: RouteProp<RootStackParamList, 'TaskDetail'>;
};

// ─── Status display helpers ───────────────────────────────────────────────────

type TaskStatus = Task['status'];

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: '未着手',
  in_progress: '進行中',
  done: '完了',
};

const STATUS_BADGE_VARIANT: Record<TaskStatus, 'todo' | 'inProgress' | 'done'> = {
  todo: 'todo',
  in_progress: 'inProgress',
  done: 'done',
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${y}年${Number(m)}月${Number(d)}日`;
}

function formatCreatedAt(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  } catch {
    return iso;
  }
}

// ─── Field Row ────────────────────────────────────────────────────────────────

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={fieldStyles.row}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={fieldStyles.value}>{children}</View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
    gap: spacing['4'],
  },
  label: {
    width: 72,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: palette.textSubtle,
    paddingTop: 2,
    flexShrink: 0,
  },
  value: {
    flex: 1,
  },
});

// ─── Main component ───────────────────────────────────────────────────────────

export function TaskDetailScreen({ navigation, route }: Props) {
  const { task: initialTask, teamMembers, teamId } = route.params;

  const [task] = useState<Task>(initialTask);
  const [showEditModal, setShowEditModal] = useState(false);

  const deadline = formatDate(task.deadline);
  const createdAt = formatCreatedAt(task.created_at);

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
          accessibilityLabel="戻る"
        >
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>戻る</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>タスク詳細</Text>

        <TouchableOpacity
          onPress={() => setShowEditModal(true)}
          style={styles.editBtn}
          hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
          accessibilityLabel="タスクを編集"
        >
          <Text style={styles.editBtnText}>編集</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Title card ── */}
        <View style={styles.titleCard}>
          <View style={styles.titleRow}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Badge
              label={STATUS_LABEL[task.status]}
              variant={STATUS_BADGE_VARIANT[task.status]}
            />
          </View>

          {task.description ? (
            <Text style={styles.taskDesc}>{task.description}</Text>
          ) : (
            <Text style={styles.noDesc}>説明なし</Text>
          )}
        </View>

        {/* ── Details card ── */}
        <View style={styles.detailCard}>
          {/* Assignee */}
          <FieldRow label="担当者">
            {task.assignee_name ? (
              <View style={styles.assigneeRow}>
                <Avatar name={task.assignee_name} size="sm" />
                <Text style={styles.assigneeName}>{task.assignee_name}</Text>
              </View>
            ) : (
              <Text style={styles.unsetText}>未設定</Text>
            )}
          </FieldRow>

          {/* Status */}
          <FieldRow label="ステータス">
            <Badge
              label={STATUS_LABEL[task.status]}
              variant={STATUS_BADGE_VARIANT[task.status]}
            />
          </FieldRow>

          {/* Deadline */}
          <FieldRow label="期限">
            {deadline ? (
              <View style={styles.deadlineRow}>
                <Text style={styles.deadlineIcon}>📅</Text>
                <Text style={styles.deadlineText}>{deadline}</Text>
              </View>
            ) : (
              <Text style={styles.unsetText}>未設定</Text>
            )}
          </FieldRow>

          {/* Created at — no bottom border on last row */}
          <View style={[fieldStyles.row, styles.lastRow]}>
            <Text style={fieldStyles.label}>作成日</Text>
            <View style={fieldStyles.value}>
              <Text style={styles.metaText}>{createdAt}</Text>
            </View>
          </View>
        </View>

        {/* ── Edit prompt ── */}
        <TouchableOpacity
          style={styles.editCard}
          onPress={() => setShowEditModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.editCardText}>✏️　タスクを編集する</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Edit modal ── */}
      <CreateTaskModal
        visible={showEditModal}
        teamId={teamId}
        task={task}
        teamMembers={teamMembers}
        onClose={() => setShowEditModal(false)}
        onSaved={() => {
          setShowEditModal(false);
          // Pop back so the list refreshes via TasksScreen's own load()
          navigation.goBack();
        }}
      />
    </View>
  );
}

TaskDetailScreen.displayName = 'TaskDetailScreen';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bgPage,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: spacing['5'],
    backgroundColor: palette.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['1'],
    minWidth: 56,
  },
  backArrow: {
    fontSize: typography.sizes.md,
    color: palette.primary,
    fontWeight: typography.weights.semibold,
  },
  backText: {
    fontSize: typography.sizes.sm,
    color: palette.primary,
    fontWeight: typography.weights.semibold,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: palette.text,
    textAlign: 'center',
  },
  editBtn: {
    minWidth: 56,
    alignItems: 'flex-end',
  },
  editBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: palette.primary,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing['4'],
    gap: spacing['3'],
    paddingBottom: spacing['10'],
  },

  // Title card
  titleCard: {
    backgroundColor: palette.bgCard,
    borderRadius: radii.lg,
    padding: spacing['5'],
    gap: spacing['3'],
    ...cardShadow,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing['3'],
  },
  taskTitle: {
    flex: 1,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: palette.text,
    lineHeight: typography.sizes.xl * typography.lineHeights.tight,
  },
  taskDesc: {
    fontSize: typography.sizes.base,
    color: palette.textMuted,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
  },
  noDesc: {
    fontSize: typography.sizes.sm,
    color: palette.textSubtle,
    fontStyle: 'italic',
  },

  // Detail card
  detailCard: {
    backgroundColor: palette.bgCard,
    borderRadius: radii.lg,
    paddingHorizontal: spacing['5'],
    ...cardShadow,
  },
  lastRow: {
    borderBottomWidth: 0,
  },

  // Assignee
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
  },
  assigneeName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: palette.text,
  },

  // Deadline
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
  },
  deadlineIcon: {
    fontSize: typography.sizes.base,
  },
  deadlineText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: palette.text,
  },

  // Generic value styles
  unsetText: {
    fontSize: typography.sizes.sm,
    color: palette.textSubtle,
    fontStyle: 'italic',
  },
  metaText: {
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    paddingTop: 2,
  },

  // Edit prompt card
  editCard: {
    backgroundColor: palette.primaryMuted,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.primary + '44',
    paddingVertical: spacing['4'],
    alignItems: 'center',
  },
  editCardText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: palette.primary,
  },
});
