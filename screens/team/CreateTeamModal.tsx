import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { palette, cardShadow, typography, spacing, radii } from '../../lib/designTokens';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: (teamId: string, teamName: string) => void;
};

type ViewState = 'form' | 'success';

const MAX_NAME_LENGTH = 30;

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateTeamModal({ visible, onClose, onCreated }: Props) {
  const { profile } = useAuth();

  const [viewState, setViewState] = useState<ViewState>('form');
  const [teamName, setTeamName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdTeamId, setCreatedTeamId] = useState('');
  const [createdTeamName, setCreatedTeamName] = useState('');

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setViewState('form');
      setTeamName('');
      setNameError(null);
      setLoading(false);
      setCreatedTeamId('');
      setCreatedTeamName('');
    }
  }, [visible]);

  const handleCreate = async () => {
    const trimmed = teamName.trim();
    if (!trimmed) {
      setNameError('チーム名を入力してください');
      return;
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      setNameError(`${MAX_NAME_LENGTH}文字以内で入力してください`);
      return;
    }
    if (!profile?.id) {
      setNameError('ユーザー情報が取得できませんでした。再ログインしてください。');
      return;
    }

    setLoading(true);
    setNameError(null);

    // 1. Insert new team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({ name: trimmed })
      .select()
      .single();

    if (teamError || !team) {
      setLoading(false);
      setNameError(teamError?.message ?? 'チームの作成に失敗しました');
      return;
    }

    // 2. Update current user's profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ team_id: team.id, role: 'owner' })
      .eq('id', profile.id);

    setLoading(false);

    if (profileError) {
      setNameError(profileError.message);
      return;
    }

    const id = String(team.id);
    const name = trimmed;
    setCreatedTeamId(id);
    setCreatedTeamName(name);
    setViewState('success');

    // 3. Notify parent (parent will also call refreshProfile)
    onCreated(id, name);
  };

  const inviteCode = createdTeamId
    ? createdTeamId.slice(0, 8).toUpperCase()
    : '';

  const handleCopyCode = () => {
    Alert.alert('招待コード', `招待コード: ${inviteCode}\n\nこのコードをメンバーに共有してください。`, [
      { text: 'OK' },
    ]);
  };

  const handleDone = () => {
    onClose();
  };

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
        onPress={viewState === 'form' ? onClose : undefined}
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
              {viewState === 'form' ? 'チームを作成' : 'チームが完成しました'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
            >
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {viewState === 'form' ? (
              /* ── Form view ── */
              <View style={styles.formContainer}>
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.fieldLabel}>チーム名</Text>
                    <Text style={styles.charCounter}>
                      {teamName.length}/{MAX_NAME_LENGTH}
                    </Text>
                  </View>
                  <TextInput
                    style={[styles.input, nameError ? styles.inputError : null]}
                    placeholder="例：開発チーム、営業部など"
                    placeholderTextColor={palette.textSubtle}
                    value={teamName}
                    onChangeText={(text) => {
                      setTeamName(text);
                      if (nameError) setNameError(null);
                    }}
                    maxLength={MAX_NAME_LENGTH}
                    returnKeyType="done"
                    onSubmitEditing={handleCreate}
                    autoFocus
                  />
                  {nameError ? (
                    <Text style={styles.errorText}>{nameError}</Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    (loading || !teamName.trim()) && styles.primaryBtnDisabled,
                  ]}
                  onPress={handleCreate}
                  disabled={loading || !teamName.trim()}
                  activeOpacity={0.82}
                >
                  {loading ? (
                    <ActivityIndicator color={palette.onInverse} />
                  ) : (
                    <Text style={styles.primaryBtnText}>チームを作成する</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* ── Success view ── */
              <View style={styles.successContainer}>
                <Text style={styles.successEmoji}>✅</Text>
                <Text style={styles.successTitle}>チームを作成しました！</Text>
                <Text style={styles.successTeamName}>{createdTeamName}</Text>

                <View style={styles.inviteCodeCard}>
                  <Text style={styles.inviteCodeLabel}>招待コード</Text>
                  <Text style={styles.inviteCode}>{inviteCode}</Text>
                  <Text style={styles.inviteCodeHint}>
                    このコードをメンバーに共有してください
                  </Text>
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={handleCopyCode}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.copyBtnText}>📋 コードを表示・共有</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={handleDone}
                  activeOpacity={0.82}
                >
                  <Text style={styles.doneBtnText}>完了</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

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
    maxHeight: '85%',
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
  scrollContent: {
    paddingBottom: spacing['10'],
  },

  // Form
  formContainer: {
    padding: spacing['5'],
    gap: spacing['5'],
  },
  fieldGroup: {
    gap: spacing['2'],
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: palette.text,
  },
  charCounter: {
    fontSize: typography.sizes.xs,
    color: palette.textSubtle,
  },
  input: {
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    fontSize: typography.sizes.base,
    color: palette.text,
    backgroundColor: palette.bgPage,
  },
  inputError: {
    borderColor: palette.error,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    color: palette.error,
    marginTop: spacing['1'],
  },
  primaryBtn: {
    backgroundColor: palette.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing['4'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: palette.onInverse,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },

  // Success
  successContainer: {
    padding: spacing['5'],
    alignItems: 'center',
    gap: spacing['4'],
  },
  successEmoji: {
    fontSize: 56,
    marginTop: spacing['4'],
  },
  successTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: palette.text,
    textAlign: 'center',
  },
  successTeamName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: palette.primary,
    textAlign: 'center',
  },
  inviteCodeCard: {
    width: '100%',
    backgroundColor: palette.bgSubtle,
    borderRadius: radii.lg,
    padding: spacing['5'],
    alignItems: 'center',
    gap: spacing['2'],
    borderWidth: 1,
    borderColor: palette.border,
    marginTop: spacing['2'],
  },
  inviteCodeLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: palette.textMuted,
  },
  inviteCode: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: palette.primary,
    letterSpacing: 6,
    fontVariant: ['tabular-nums'],
  },
  inviteCodeHint: {
    fontSize: typography.sizes.xs,
    color: palette.textSubtle,
    textAlign: 'center',
    marginTop: spacing['1'],
  },
  copyBtn: {
    marginTop: spacing['2'],
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['2'],
  },
  copyBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: palette.text,
  },
  doneBtn: {
    width: '100%',
    backgroundColor: palette.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing['4'],
    alignItems: 'center',
    marginTop: spacing['2'],
  },
  doneBtnText: {
    color: palette.onInverse,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
});
