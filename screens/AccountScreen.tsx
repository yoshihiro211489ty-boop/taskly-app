import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootStack';
import { useAuth } from '../lib/AuthContext';
import { palette, cardShadow, typography, spacing, radii } from '../lib/designTokens';
import { LanguageSwitcher } from '../lib/i18n/LanguageSwitcher';
import Constants from 'expo-constants';

// ─── External URLs ───────────────────────────────────────────────────────────
// TODO: 本番ドメイン確定後に置き換える（Notion公開ページ → 独自ドメインへ集約予定）
const PRIVACY_URL: string | null = null;
const TERMS_URL: string | null = null;
const SUPPORT_EMAIL: string | null = null;

// ─── App version ─────────────────────────────────────────────────────────────
const APP_VERSION =
  (Constants.expoConfig?.version as string | undefined) ??
  (Constants.manifest as { version?: string } | null)?.version ??
  '1.0.0';

// ─── SettingsRow ─────────────────────────────────────────────────────────────
function SettingsRow({
  icon,
  label,
  value,
  onPress,
  destructive = false,
  rightElement,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  rightElement?: React.ReactNode;
}) {
  const labelColor = destructive ? palette.error : palette.text;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress && !rightElement}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, { color: labelColor }]}>{label}</Text>
      <View style={styles.rowRight}>
        {rightElement ? (
          rightElement
        ) : (
          <>
            {value !== undefined && (
              <Text style={styles.rowValue}>{value}</Text>
            )}
            {onPress && (
              <Text style={[styles.rowChevron, { color: destructive ? palette.error : palette.textSubtle }]}>›</Text>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

// ─── Password Change Modal ────────────────────────────────────────────────────
function PasswordChangeModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { updatePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage(null);
    setSaving(false);
    onClose();
  };

  const handleSave = async () => {
    setMessage(null);

    if (!currentPassword) {
      setMessage({ text: '現在のパスワードを入力してください', isError: true });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ text: '新しいパスワードは8文字以上で入力してください', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'パスワードが一致しません', isError: true });
      return;
    }

    setSaving(true);
    const { error } = await updatePassword(newPassword);
    setSaving(false);

    if (error) {
      setMessage({ text: error, isError: true });
    } else {
      setMessage({ text: 'パスワードを変更しました', isError: false });
      setTimeout(handleClose, 1500);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>パスワードを変更</Text>
          <TouchableOpacity onPress={handleClose} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseText}>閉じる</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.inputLabel}>現在のパスワード</Text>
          <TextInput
            style={styles.textInput}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="現在のパスワード"
            placeholderTextColor={palette.textSubtle}
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>新しいパスワード</Text>
          <TextInput
            style={styles.textInput}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="8文字以上"
            placeholderTextColor={palette.textSubtle}
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>新しいパスワード（確認）</Text>
          <TextInput
            style={styles.textInput}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="もう一度入力"
            placeholderTextColor={palette.textSubtle}
            autoCapitalize="none"
          />

          {message && (
            <View
              style={[
                styles.messageBox,
                message.isError ? styles.messageBoxError : styles.messageBoxSuccess,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  { color: message.isError ? palette.error : palette.success },
                ]}
              >
                {message.text}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>保存する</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── AccountScreen ────────────────────────────────────────────────────────────
export function AccountScreen() {
  const { profile, signOut, deleteAccount } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSignOut = () => {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: 'ログアウト', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'アカウントを削除しますか？',
      'この操作は取り消せません。すべてのデータ（タスク、ルーティン記録、チーム情報）が完全に削除されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            const { error } = await deleteAccount();
            setDeletingAccount(false);
            if (error) {
              Alert.alert('エラー', error);
            }
          },
        },
      ]
    );
  };

  const showAlert = (title: string, message?: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(message ? `${title}\n\n${message}` : title);
    } else {
      Alert.alert(title, message);
    }
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    // Web: navigator.clipboard
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    }
    // Native: expo-clipboard
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Clipboard = require('expo-clipboard') as {
        setStringAsync: (text: string) => Promise<void>;
      };
      await Clipboard.setStringAsync(text);
      return true;
    } catch {
      return false;
    }
  };

  const handleInvite = async () => {
    if (!profile?.teamId) return;
    const inviteLink = `taskly://join/${profile.teamId}`;
    const copied = await copyToClipboard(inviteLink);
    if (copied) {
      showAlert(
        'コピーしました',
        `招待リンクをクリップボードにコピーしました。\n\n${inviteLink}`,
      );
    } else {
      showAlert('招待リンク', inviteLink);
    }
  };

  const handlePrivacy = () => {
    if (PRIVACY_URL) void Linking.openURL(PRIVACY_URL);
    else showAlert('準備中', 'プライバシーポリシーは現在準備中です。');
  };
  const handleTerms = () => {
    if (TERMS_URL) void Linking.openURL(TERMS_URL);
    else showAlert('準備中', '利用規約は現在準備中です。');
  };
  const handleSupport = () => {
    if (SUPPORT_EMAIL) void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=お問い合わせ`);
    else showAlert('準備中', 'お問い合わせ窓口は現在準備中です。');
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>アカウント</Text>
      </View>

      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile card ─────────────────────────────────────────────────── */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.name ?? '名前未設定'}</Text>
          <Text style={styles.email}>{profile?.email ?? ''}</Text>
          <View style={styles.badgeRow}>
            {profile?.teamName ? (
              <View style={styles.teamBadge}>
                <Text style={styles.teamText}>👥 {profile.teamName}</Text>
              </View>
            ) : null}
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {profile?.role === 'owner' ? 'オーナー' : 'メンバー'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── チーム ───────────────────────────────────────────────────────── */}
        <Section title="チーム">
          <SettingsRow
            icon="🏠"
            label="チーム名"
            value={profile?.teamName ?? '未参加'}
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="👥"
            label="チームメンバー"
            onPress={() => navigation.navigate('TeamMembers')}
          />
          {profile?.role === 'owner' && profile?.teamId ? (
            <>
              <View style={styles.rowSeparator} />
              <SettingsRow
                icon="✉️"
                label="メンバーを招待"
                onPress={handleInvite}
              />
            </>
          ) : null}
        </Section>

        {/* ── 設定 ─────────────────────────────────────────────────────────── */}
        <Section title="設定">
          <SettingsRow
            icon="🌐"
            label="言語"
            rightElement={<LanguageSwitcher />}
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="🔑"
            label="パスワードを変更"
            onPress={() => setPwModalVisible(true)}
          />
        </Section>

        {/* ── サポート ─────────────────────────────────────────────────────── */}
        <Section title="サポート">
          <SettingsRow
            icon="🔒"
            label="プライバシーポリシー"
            onPress={handlePrivacy}
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="📄"
            label="利用規約"
            onPress={handleTerms}
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="💬"
            label="お問い合わせ"
            onPress={handleSupport}
          />
        </Section>

        {/* ── アカウント ───────────────────────────────────────────────────── */}
        <Section title="アカウント">
          <SettingsRow
            icon="🚪"
            label="ログアウト"
            onPress={handleSignOut}
          />
          <View style={styles.rowSeparator} />
          {deletingAccount ? (
            <View style={[styles.row, styles.rowDeleteLoading]}>
              <ActivityIndicator color={palette.error} size="small" />
              <Text style={styles.deletingText}>削除中...</Text>
            </View>
          ) : (
            <SettingsRow
              icon="🗑️"
              label="アカウントを削除"
              onPress={handleDeleteAccount}
              destructive
            />
          )}
        </Section>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <Text style={styles.versionText}>バージョン {APP_VERSION}</Text>
      </ScrollView>

      {/* ── Password change modal ────────────────────────────────────────── */}
      <PasswordChangeModal
        visible={pwModalVisible}
        onClose={() => setPwModalVisible(false)}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bgPage,
  },
  scrollContent: {
    paddingBottom: spacing['10'],
  },

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
    fontSize: typography.sizes.xl,
    fontWeight: '900',
    color: palette.text,
  },

  // Profile card
  profileCard: {
    margin: spacing['4'],
    backgroundColor: palette.bgCard,
    borderRadius: radii.xl,
    padding: spacing['6'],
    alignItems: 'center',
    ...cardShadow,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['3'],
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: palette.onInverse,
  },
  name: {
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    color: palette.text,
    marginBottom: spacing['1'],
  },
  email: {
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    marginBottom: spacing['3'],
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing['2'],
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  teamBadge: {
    backgroundColor: palette.bgSubtle,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  teamText: {
    fontSize: typography.sizes.sm,
    color: palette.primary,
    fontWeight: '700',
  },
  roleBadge: {
    backgroundColor: palette.accentWash,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  roleText: {
    fontSize: typography.sizes.xs,
    color: palette.accent,
    fontWeight: '700',
  },

  // Section
  section: {
    marginHorizontal: spacing['4'],
    marginBottom: spacing['4'],
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: palette.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing['2'],
    marginLeft: spacing['1'],
  },
  sectionCard: {
    backgroundColor: palette.bgCard,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.borderLight,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing['4'],
    paddingVertical: 14,
    minHeight: 52,
  },
  rowIcon: {
    fontSize: 18,
    marginRight: spacing['3'],
    width: 26,
    textAlign: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: '500',
    color: palette.text,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
  },
  rowValue: {
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
  },
  rowChevron: {
    fontSize: 20,
    color: palette.textSubtle,
    lineHeight: 24,
  },
  rowSeparator: {
    height: 1,
    backgroundColor: palette.borderLight,
    marginLeft: spacing['4'] + 26 + spacing['3'], // align with label start
  },
  rowDeleteLoading: {
    gap: spacing['3'],
  },
  deletingText: {
    fontSize: typography.sizes.base,
    color: palette.error,
    fontWeight: '500',
  },

  // Footer
  versionText: {
    textAlign: 'center',
    fontSize: typography.sizes.xs,
    color: palette.textSubtle,
    marginTop: spacing['4'],
  },

  // Modal
  modalRoot: {
    flex: 1,
    backgroundColor: palette.bgPage,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['5'],
    paddingTop: spacing['6'],
    paddingBottom: spacing['4'],
    backgroundColor: palette.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
  },
  modalTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '800',
    color: palette.text,
  },
  modalCloseBtn: {
    padding: spacing['2'],
  },
  modalCloseText: {
    fontSize: typography.sizes.base,
    color: palette.primary,
    fontWeight: '600',
  },
  modalBody: {
    flex: 1,
    padding: spacing['5'],
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: palette.textMuted,
    marginBottom: spacing['2'],
    marginTop: spacing['4'],
  },
  textInput: {
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing['4'],
    paddingVertical: 12,
    fontSize: typography.sizes.base,
    color: palette.text,
  },
  messageBox: {
    marginTop: spacing['4'],
    padding: spacing['3'],
    borderRadius: radii.md,
    borderWidth: 1,
  },
  messageBoxError: {
    backgroundColor: palette.errorBg,
    borderColor: palette.errorBorder,
  },
  messageBoxSuccess: {
    backgroundColor: palette.successBg,
    borderColor: palette.successBorder,
  },
  messageText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: spacing['6'],
    backgroundColor: palette.primary,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: palette.onInverse,
    fontSize: typography.sizes.base,
    fontWeight: '700',
  },
});
