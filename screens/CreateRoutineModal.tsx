import { useEffect, useState } from 'react';
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
import { Button } from '../components';
import { TextInput } from '../components';
import { palette, cardShadow, statusColors, typography, spacing, radii } from '../lib/designTokens';
import { supabase } from '../lib/supabase';

type Routine = {
  id: string;
  title: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'monthly';
  done_today: boolean;
};

type Frequency = 'daily' | 'weekly' | 'monthly';

type Props = {
  visible: boolean;
  teamId: string;
  routine?: Routine | null;
  onClose: () => void;
  onSaved: () => void;
};

const FREQ_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'daily', label: '毎日' },
  { value: 'weekly', label: '毎週' },
  { value: 'monthly', label: '毎月' },
];

export function CreateRoutineModal({ visible, teamId, routine, onClose, onSaved }: Props) {
  const isEditing = routine != null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sync form state when routine prop changes
  useEffect(() => {
    if (visible) {
      setTitle(routine?.title ?? '');
      setDescription(routine?.description ?? '');
      setFrequency(routine?.frequency ?? 'daily');
    }
  }, [visible, routine]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('routines')
          .update({ title: title.trim(), description: description.trim() || null, frequency })
          .eq('id', routine.id);
        if (error) {
          console.warn('[CreateRoutineModal] update error:', error.message);
          return;
        }
      } else {
        const { error } = await supabase.from('routines').insert({
          title: title.trim(),
          description: description.trim() || null,
          frequency,
          team_id: teamId,
        });
        if (error) {
          console.warn('[CreateRoutineModal] insert error:', error.message);
          return;
        }
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'ルーティンを削除',
      'このルーティンを削除しますか？過去の完了記録も削除されます',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            if (!routine) return;
            setDeleting(true);
            try {
              // Delete logs first (FK constraint)
              const { error: logsError } = await supabase
                .from('routine_logs')
                .delete()
                .eq('routine_id', routine.id);
              if (logsError) {
                console.warn('[CreateRoutineModal] delete logs error:', logsError.message);
                return;
              }
              const { error: routineError } = await supabase
                .from('routines')
                .delete()
                .eq('id', routine.id);
              if (routineError) {
                console.warn('[CreateRoutineModal] delete routine error:', routineError.message);
                return;
              }
              onSaved();
              onClose();
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetWrapper}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.sheetTitle}>
                {isEditing ? 'ルーティンを編集' : 'ルーティンを追加'}
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Title input */}
            <View style={styles.fieldGroup}>
              <TextInput
                label="タイトル"
                value={title}
                onChangeText={setTitle}
                placeholder="例: 朝のストレッチ"
                returnKeyType="next"
                autoFocus={!isEditing}
              />
            </View>

            {/* Description input */}
            <View style={styles.fieldGroup}>
              <TextInput
                label="説明（任意）"
                value={description}
                onChangeText={setDescription}
                placeholder="詳細メモ..."
                multiline
                numberOfLines={2}
                style={styles.descInput}
                returnKeyType="done"
                blurOnSubmit
              />
            </View>

            {/* Frequency selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>頻度</Text>
              <View style={styles.freqRow}>
                {FREQ_OPTIONS.map((opt) => {
                  const active = frequency === opt.value;
                  const colors = statusColors[opt.value];
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.freqBtn,
                        active && {
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                        },
                        !active && styles.freqBtnInactive,
                      ]}
                      onPress={() => setFrequency(opt.value)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.freqBtnText,
                          active && { color: colors.text, fontWeight: typography.weights.bold },
                          !active && styles.freqBtnTextInactive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Save button */}
            <View style={styles.actions}>
              <Button
                label={isEditing ? '保存する' : '追加する'}
                onPress={handleSave}
                variant="primary"
                size="lg"
                disabled={!title.trim()}
                loading={saving}
              />

              {/* Delete button — edit mode only */}
              {isEditing && (
                <Button
                  label="このルーティンを削除"
                  onPress={handleDelete}
                  variant="danger"
                  size="md"
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

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    ...cardShadow,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.border,
    marginTop: 12,
    marginBottom: 4,
  },
  scrollContent: {
    paddingHorizontal: spacing['5'],
    paddingTop: spacing['2'],
    paddingBottom: spacing['4'],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['5'],
  },
  sheetTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: palette.text,
  },
  closeBtn: {
    fontSize: typography.sizes.md,
    color: palette.textSubtle,
    paddingHorizontal: 4,
  },
  fieldGroup: {
    marginBottom: spacing['5'],
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: palette.text,
    marginBottom: spacing['2'],
  },
  descInput: {
    minHeight: 64,
    textAlignVertical: 'top',
    paddingTop: spacing['3'],
  },
  freqRow: {
    flexDirection: 'row',
    gap: spacing['3'],
  },
  freqBtn: {
    flex: 1,
    paddingVertical: spacing['3'],
    borderRadius: radii.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqBtnInactive: {
    backgroundColor: palette.bgPage,
    borderColor: palette.border,
  },
  freqBtnText: {
    fontSize: typography.sizes.base,
  },
  freqBtnTextInactive: {
    color: palette.textMuted,
    fontWeight: typography.weights.medium,
  },
  actions: {
    gap: spacing['3'],
    marginTop: spacing['2'],
  },
  deleteBtn: {
    marginTop: spacing['1'],
  },
});
