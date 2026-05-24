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
  ScrollView,
} from 'react-native';
import { palette, cardShadow, typography, spacing, radii } from '../../lib/designTokens';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  onClose: () => void;
  onJoined: (teamId: string, teamName: string) => void;
};

type ViewState = 'form' | 'success';

const SHORT_CODE_LENGTH = 8;

// ─── Component ────────────────────────────────────────────────────────────────

export function JoinTeamModal({ visible, onClose, onJoined }: Props) {
  const { profile } = useAuth();

  const [viewState, setViewState] = useState<ViewState>('form');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [joinedTeamName, setJoinedTeamName] = useState('');

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setViewState('form');
      setCode('');
      setCodeError(null);
      setLoading(false);
      setJoinedTeamName('');
    }
  }, [visible]);

  const handleCodeChange = (text: string) => {
    // Auto uppercase; allow alphanumeric and hyphens (UUID)
    setCode(text.toUpperCase());
    if (codeError) setCodeError(null);
  };

  const handleJoin = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setCodeError('招待コードを入力してください');
      return;
    }
    if (!profile?.id) {
      setCodeError('ユーザー情報が取得できませんでした。再ログインしてください。');
      return;
    }

    setLoading(true);
    setCodeError(null);

    // Normalize: short 8-char codes are stored lowercase in UUID prefix
    const normalizedCode = trimmed.toLowerCase();
    const isShortCode = trimmed.length === SHORT_CODE_LENGTH;

    let team: { id: string; name: string } | null = null;
    let teamError: { message: string } | null = null;

    if (isShortCode) {
      // teams.id は uuid 型で PostgREST が ilike をサポートしないので、
      // 一旦全件取得してクライアント側で UUID プレフィックス一致を取る。
      // チーム数は数百〜数千規模を想定しており、scalability の懸念があれば
      // 将来 short_code 専用カラムを teams テーブルに追加する。
      const { data, error } = await supabase.from('teams').select('id, name');
      if (error) {
        teamError = error;
      } else {
        const matched = (data ?? []).filter((row: { id: string }) =>
          String(row.id).toLowerCase().startsWith(normalizedCode),
        );
        if (matched.length === 1) {
          team = matched[0] as { id: string; name: string };
        } else if (matched.length > 1) {
          teamError = { message: '招待コードが複数のチームに一致しました。フルUUIDを使用してください。' };
        }
      }
    } else {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', normalizedCode)
        .maybeSingle();
      team = data as { id: string; name: string } | null;
      teamError = error;
    }

    if (teamError) {
      setLoading(false);
      setCodeError(teamError.message);
      return;
    }

    if (!team) {
      setLoading(false);
      setCodeError('招待コードが見つかりません。コードを確認して再度お試しください。');
      return;
    }

    // Update profile to join the team
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ team_id: team.id, role: 'member' })
      .eq('id', profile.id);

    setLoading(false);

    if (profileError) {
      setCodeError(profileError.message);
      return;
    }

    const teamId = String(team.id);
    const teamName = String(team.name);
    setJoinedTeamName(teamName);
    setViewState('success');

    // Notify parent
    onJoined(teamId, teamName);
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
              {viewState === 'form' ? 'チームに参加' : 'チームに参加しました'}
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
                <Text style={styles.formDescription}>
                  チームのオーナーから受け取った招待コード（8文字）またはチームIDを入力してください。
                </Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>招待コード</Text>
                  <TextInput
                    style={[
                      styles.codeInput,
                      codeError ? styles.codeInputError : null,
                    ]}
                    placeholder="例：A1B2C3D4"
                    placeholderTextColor={palette.textSubtle}
                    value={code}
                    onChangeText={handleCodeChange}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleJoin}
                    autoFocus
                    maxLength={36} // UUID max length
                  />
                  {codeError ? (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{codeError}</Text>
                    </View>
                  ) : (
                    <Text style={styles.codeHint}>
                      8文字のコード、またはフルUUIDを入力
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    (loading || !code.trim()) && styles.primaryBtnDisabled,
                  ]}
                  onPress={handleJoin}
                  disabled={loading || !code.trim()}
                  activeOpacity={0.82}
                >
                  {loading ? (
                    <ActivityIndicator color={palette.onInverse} />
                  ) : (
                    <Text style={styles.primaryBtnText}>チームに参加する</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* ── Success view ── */
              <View style={styles.successContainer}>
                <Text style={styles.successEmoji}>🎉</Text>
                <Text style={styles.successTitle}>チームに参加しました！</Text>
                <View style={styles.successTeamBadge}>
                  <Text style={styles.successTeamBadgeEmoji}>👥</Text>
                  <Text style={styles.successTeamName}>{joinedTeamName}</Text>
                </View>
                <Text style={styles.successDesc}>
                  チームのタスクとルーティンにアクセスできるようになりました。
                </Text>

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
  formDescription: {
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  fieldGroup: {
    gap: spacing['2'],
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: palette.text,
  },
  codeInput: {
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['4'],
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: palette.text,
    backgroundColor: palette.bgPage,
    textAlign: 'center',
    letterSpacing: 4,
  },
  codeInputError: {
    borderColor: palette.error,
  },
  codeHint: {
    fontSize: typography.sizes.xs,
    color: palette.textSubtle,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: palette.errorBg,
    borderColor: palette.errorBorder,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing['3'],
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: palette.error,
    textAlign: 'center',
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
  successTeamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.bgSubtle,
    paddingHorizontal: spacing['5'],
    paddingVertical: spacing['3'],
    borderRadius: radii.full,
    gap: spacing['2'],
    borderWidth: 1,
    borderColor: palette.border,
  },
  successTeamBadgeEmoji: {
    fontSize: 20,
  },
  successTeamName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: palette.primary,
  },
  successDesc: {
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    maxWidth: 260,
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
