import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { palette, radii, spacing, typography, cardShadow } from '../lib/designTokens';
import { Button, TextInput } from '../components';

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = 'todo' | 'in_progress' | 'done';

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee_id: string | null;
  assignee_name: string | null;
  deadline: string | null;
  created_at: string;
};

export type Props = {
  visible: boolean;
  teamId: string;
  task?: Task | null;
  teamMembers: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: '未着手' },
  { value: 'in_progress', label: '進行中' },
  { value: 'done', label: '完了' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR + i - 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function isoToDate(iso: string | null): { year: number; month: number; day: number } | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m, day: d };
}

function dateToIso(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CreateTaskModal({
  visible,
  teamId,
  task,
  teamMembers,
  onClose,
  onSaved,
}: Props) {
  const isEditMode = task != null;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [deadlineEnabled, setDeadlineEnabled] = useState(false);
  const [deadlineYear, setDeadlineYear] = useState(CURRENT_YEAR);
  const [deadlineMonth, setDeadlineMonth] = useState(new Date().getMonth() + 1);
  const [deadlineDay, setDeadlineDay] = useState(new Date().getDate());

  // UI state
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [titleError, setTitleError] = useState<string | undefined>(undefined);

  // Populate form when switching between tasks / modes
  const resetForm = useCallback(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setStatus(task.status);
      setAssigneeId(task.assignee_id);
      const parsed = isoToDate(task.deadline);
      if (parsed) {
        setDeadlineEnabled(true);
        setDeadlineYear(parsed.year);
        setDeadlineMonth(parsed.month);
        setDeadlineDay(parsed.day);
      } else {
        setDeadlineEnabled(false);
        setDeadlineYear(CURRENT_YEAR);
        setDeadlineMonth(new Date().getMonth() + 1);
        setDeadlineDay(new Date().getDate());
      }
    } else {
      setTitle('');
      setDescription('');
      setStatus('todo');
      setAssigneeId(null);
      setDeadlineEnabled(false);
      setDeadlineYear(CURRENT_YEAR);
      setDeadlineMonth(new Date().getMonth() + 1);
      setDeadlineDay(new Date().getDate());
    }
    setTitleError(undefined);
    setSaving(false);
    setDeleting(false);
  }, [task]);

  useEffect(() => {
    if (visible) resetForm();
  }, [visible, resetForm]);

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('タイトルを入力してください');
      return;
    }

    setSaving(true);
    setTitleError(undefined);

    const deadline = deadlineEnabled
      ? dateToIso(deadlineYear, deadlineMonth, deadlineDay)
      : null;

    const payload = {
      title: trimmedTitle,
      description: description.trim() || null,
      status,
      assignee_id: assigneeId,
      deadline,
      team_id: teamId,
    };

    let error: { message: string } | null = null;

    if (isEditMode && task) {
      const { error: e } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', task.id);
      error = e;
    } else {
      const { error: e } = await supabase.from('tasks').insert(payload);
      error = e;
    }

    setSaving(false);

    if (error) {
      Alert.alert('エラー', error.message);
      return;
    }

    onSaved();
    onClose();
  };

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = () => {
    if (!task) return;
    Alert.alert(
      'タスクを削除',
      `「${task.title}」を削除してもよろしいですか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const { error } = await supabase
              .from('tasks')
              .delete()
              .eq('id', task.id);
            setDeleting(false);
            if (error) {
              Alert.alert('エラー', error.message);
              return;
            }
            onSaved();
            onClose();
          },
        },
      ],
    );
  };

  // ── Assignee toggle ─────────────────────────────────────────────────────────

  const toggleAssignee = (id: string) => {
    setAssigneeId((prev) => (prev === id ? null : id));
  };

  // ── Deadline spinners ───────────────────────────────────────────────────────

  const clampDay = (year: number, month: number, day: number) => {
    const maxDay = new Date(year, month, 0).getDate(); // last day of month
    return Math.min(day, maxDay);
  };

  const setDeadlineYearSafe = (y: number) => {
    setDeadlineYear(y);
    setDeadlineDay((d) => clampDay(y, deadlineMonth, d));
  };

  const setDeadlineMonthSafe = (m: number) => {
    setDeadlineMonth(m);
    setDeadlineDay((d) => clampDay(deadlineYear, m, d));
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
        accessibilityLabel="閉じる"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kvWrapper}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {isEditMode ? 'タスクを編集' : 'タスクを追加'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── タイトル ── */}
            <TextInput
              label="タイトル *"
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (t.trim()) setTitleError(undefined);
              }}
              placeholder="タスクのタイトルを入力"
              returnKeyType="next"
              error={titleError}
            />

            {/* ── 説明 ── */}
            <TextInput
              label="説明"
              value={description}
              onChangeText={setDescription}
              placeholder="詳細を入力（任意）"
              multiline
              numberOfLines={3}
              style={styles.textAreaInput}
              textAlignVertical="top"
            />

            {/* ── ステータス ── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ステータス</Text>
              <View style={styles.statusRow}>
                {STATUS_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.statusToggle,
                      status === opt.value && styles.statusToggleActive,
                    ]}
                    onPress={() => setStatus(opt.value)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.statusToggleText,
                        status === opt.value && styles.statusToggleTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── 担当者 ── */}
            {teamMembers.length > 0 && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>担当者</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.assigneeRow}
                >
                  {teamMembers.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.assigneePill,
                        assigneeId === m.id && styles.assigneePillActive,
                      ]}
                      onPress={() => toggleAssignee(m.id)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.assigneeInitialBubble, assigneeId === m.id && styles.assigneeInitialBubbleActive]}>
                        <Text style={[styles.assigneeInitial, assigneeId === m.id && styles.assigneeInitialActive]}>
                          {m.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.assigneeName,
                          assigneeId === m.id && styles.assigneeNameActive,
                        ]}
                      >
                        {m.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── 期限 ── */}
            <View style={styles.fieldGroup}>
              <View style={styles.deadlineHeaderRow}>
                <Text style={styles.fieldLabel}>期限</Text>
                <TouchableOpacity
                  style={[styles.deadlineToggle, deadlineEnabled && styles.deadlineToggleOn]}
                  onPress={() => setDeadlineEnabled((v) => !v)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.deadlineToggleText, deadlineEnabled && styles.deadlineToggleTextOn]}>
                    {deadlineEnabled ? '設定済み' : '設定なし'}
                  </Text>
                </TouchableOpacity>
              </View>

              {deadlineEnabled && (
                <View style={styles.datePickers}>
                  {/* Year */}
                  <View style={styles.datePickerGroup}>
                    <Text style={styles.datePickerLabel}>年</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.dateScrollContent}
                    >
                      {YEARS.map((y) => (
                        <TouchableOpacity
                          key={y}
                          style={[styles.datePill, deadlineYear === y && styles.datePillActive]}
                          onPress={() => setDeadlineYearSafe(y)}
                        >
                          <Text style={[styles.datePillText, deadlineYear === y && styles.datePillTextActive]}>
                            {y}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Month */}
                  <View style={styles.datePickerGroup}>
                    <Text style={styles.datePickerLabel}>月</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.dateScrollContent}
                    >
                      {MONTHS.map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[styles.datePill, deadlineMonth === m && styles.datePillActive]}
                          onPress={() => setDeadlineMonthSafe(m)}
                        >
                          <Text style={[styles.datePillText, deadlineMonth === m && styles.datePillTextActive]}>
                            {m}月
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Day */}
                  <View style={styles.datePickerGroup}>
                    <Text style={styles.datePickerLabel}>日</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.dateScrollContent}
                    >
                      {DAYS.filter((d) => d <= new Date(deadlineYear, deadlineMonth, 0).getDate()).map((d) => (
                        <TouchableOpacity
                          key={d}
                          style={[styles.datePill, deadlineDay === d && styles.datePillActive]}
                          onPress={() => setDeadlineDay(d)}
                        >
                          <Text style={[styles.datePillText, deadlineDay === d && styles.datePillTextActive]}>
                            {d}日
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.deadlinePreview}>
                    <Text style={styles.deadlinePreviewText}>
                      📅 {dateToIso(deadlineYear, deadlineMonth, deadlineDay)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* ── Buttons ── */}
            <View style={styles.actions}>
              <Button
                label={saving ? '保存中...' : isEditMode ? '変更を保存' : '作成する'}
                onPress={handleSave}
                variant="primary"
                size="lg"
                disabled={saving || deleting || !title.trim()}
                loading={saving}
              />

              {isEditMode && (
                <Button
                  label={deleting ? '削除中...' : 'タスクを削除'}
                  onPress={handleDelete}
                  variant="danger"
                  size="md"
                  disabled={saving || deleting}
                  loading={deleting}
                  style={styles.deleteBtn}
                />
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

CreateTaskModal.displayName = 'CreateTaskModal';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22, 32, 51, 0.45)',
  },
  kvWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.bgCard,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '90%',
    ...cardShadow,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: palette.disabled,
    alignSelf: 'center',
    marginTop: spacing['3'],
    marginBottom: spacing['1'],
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['5'],
    paddingVertical: spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
  },
  sheetTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: palette.text,
  },
  closeBtn: {
    fontSize: typography.sizes.md,
    color: palette.textMuted,
    fontWeight: typography.weights.semibold,
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: spacing['5'],
    gap: spacing['5'],
    paddingBottom: spacing['10'],
  },
  textAreaInput: {
    minHeight: 80,
    paddingTop: spacing['3'],
  },
  fieldGroup: {
    gap: spacing['2'],
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: palette.text,
    marginBottom: spacing['1'],
  },
  // Status toggles
  statusRow: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  statusToggle: {
    flex: 1,
    paddingVertical: spacing['2'],
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.bgPage,
  },
  statusToggleActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  statusToggleText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: palette.textMuted,
  },
  statusToggleTextActive: {
    color: palette.onInverse,
  },
  // Assignee pills
  assigneeRow: {
    flexDirection: 'row',
    gap: spacing['2'],
    paddingVertical: spacing['1'],
  },
  assigneePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    paddingVertical: spacing['2'],
    paddingHorizontal: spacing['3'],
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.bgPage,
  },
  assigneePillActive: {
    backgroundColor: palette.primaryMuted,
    borderColor: palette.primary,
  },
  assigneeInitialBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.neutral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assigneeInitialBubbleActive: {
    backgroundColor: palette.primary,
  },
  assigneeInitial: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: palette.onInverse,
  },
  assigneeInitialActive: {
    color: palette.onInverse,
  },
  assigneeName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: palette.textMuted,
  },
  assigneeNameActive: {
    color: palette.primary,
  },
  // Deadline
  deadlineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deadlineToggle: {
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['1'],
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.bgPage,
  },
  deadlineToggleOn: {
    backgroundColor: palette.accentWash,
    borderColor: palette.accent,
  },
  deadlineToggleText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: palette.textMuted,
  },
  deadlineToggleTextOn: {
    color: palette.accent,
  },
  datePickers: {
    gap: spacing['2'],
    backgroundColor: palette.bgPage,
    borderRadius: radii.md,
    padding: spacing['3'],
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  datePickerGroup: {
    gap: spacing['1'],
  },
  datePickerLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: palette.textSubtle,
    marginLeft: spacing['1'],
  },
  dateScrollContent: {
    flexDirection: 'row',
    gap: spacing['2'],
    paddingVertical: spacing['1'],
  },
  datePill: {
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['1'],
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.bgCard,
  },
  datePillActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  datePillText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: palette.textMuted,
  },
  datePillTextActive: {
    color: palette.onInverse,
  },
  deadlinePreview: {
    alignItems: 'center',
    paddingTop: spacing['2'],
  },
  deadlinePreviewText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: palette.textMuted,
  },
  // Actions
  actions: {
    gap: spacing['3'],
    paddingTop: spacing['2'],
  },
  deleteBtn: {
    marginTop: spacing['1'],
  },
});
