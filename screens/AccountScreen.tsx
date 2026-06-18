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
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootStack';
import { useAuth } from '../lib/AuthContext';
import {
  palette,
  gradients,
  shadows,
  typography,
  spacing,
  radii,
} from '../lib/designTokens';
import { LanguageSwitcher } from '../lib/i18n/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { InviteCodeModal } from './team/InviteCodeModal';
import Constants from 'expo-constants';
import { usePremium } from '../lib/billing';

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
  const { t } = useTranslation();
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
      setMessage({ text: t('account.change_password_required_current'), isError: true });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ text: t('account.change_password_too_short'), isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ text: t('account.change_password_mismatch'), isError: true });
      return;
    }

    setSaving(true);
    const { error } = await updatePassword(newPassword);
    setSaving(false);

    if (error) {
      setMessage({ text: error, isError: true });
    } else {
      setMessage({ text: t('account.change_password_success'), isError: false });
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
          <Text style={styles.modalTitle}>{t('account.change_password')}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.inputLabel}>{t('account.change_password_current')}</Text>
          <TextInput
            style={styles.textInput}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder={t('account.change_password_current_placeholder')}
            placeholderTextColor={palette.textSubtle}
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>{t('account.change_password_new')}</Text>
          <TextInput
            style={styles.textInput}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder={t('account.change_password_new_placeholder')}
            placeholderTextColor={palette.textSubtle}
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>{t('account.change_password_confirm')}</Text>
          <TextInput
            style={styles.textInput}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder={t('account.change_password_confirm_placeholder')}
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
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius: radii.lg }]}
            />
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>{t('account.change_password_save')}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── AccountScreen ────────────────────────────────────────────────────────────
export function AccountScreen() {
  const { t } = useTranslation();
  const { profile, signOut, deleteAccount } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const { isPremium } = usePremium();

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSignOut = () => {
    Alert.alert(t('account.logout_confirm_title'), t('account.logout_confirm_message'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('account.logout'), style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('account.delete_account_confirm_title'),
      t('account.delete_account_confirm_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('account.delete_confirm_button'),
          style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            const { error } = await deleteAccount();
            setDeletingAccount(false);
            if (error) {
              Alert.alert(t('common.error'), error);
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

  const handleInvite = () => {
    if (!profile?.teamId) return;
    setInviteModalVisible(true);
  };

  const handlePrivacy = () => {
    if (PRIVACY_URL) void Linking.openURL(PRIVACY_URL);
    else showAlert(t('common.coming_soon'), t('account.privacy_coming_soon'));
  };
  const handleTerms = () => {
    if (TERMS_URL) void Linking.openURL(TERMS_URL);
    else showAlert(t('common.coming_soon'), t('account.terms_coming_soon'));
  };
  const handleSupport = () => {
    if (SUPPORT_EMAIL) void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=お問い合わせ`);
    else showAlert(t('common.coming_soon'), t('account.contact_coming_soon'));
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('account.title')}</Text>
      </View>

      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Premium banner ───────────────────────────────────────────────── */}
        {!isPremium && (
          <TouchableOpacity
            style={styles.premiumBanner}
            onPress={() => navigation.navigate('Premium')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={gradients.primary} style={styles.premiumBannerGradient}>
              <Text style={styles.premiumBannerEmoji}>⭐</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumBannerTitle}>プレミアムにアップグレード</Text>
                <Text style={styles.premiumBannerDesc}>タスク・ルーティン無制限 + 詳細統計</Text>
              </View>
              <Text style={styles.premiumBannerChevron}>›</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {isPremium && (
          <View style={styles.premiumActiveBadge}>
            <Text style={styles.premiumActiveBadgeText}>⭐ プレミアム会員</Text>
          </View>
        )}

        {/* ── Profile card ─────────────────────────────────────────────────── */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.avatarText}>
              {profile?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.name ?? t('account.no_name')}</Text>
          <Text style={styles.email}>{profile?.email ?? ''}</Text>
          <View style={styles.badgeRow}>
            {profile?.teamName ? (
              <View style={styles.teamBadge}>
                <Text style={styles.teamText}>👥 {profile.teamName}</Text>
              </View>
            ) : null}
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {profile?.role === 'owner' ? t('account.role_owner') : t('account.role_member')}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Team ────────────────────────────────────────────────────────── */}
        <Section title={t('account.section_team')}>
          <SettingsRow
            icon="🏠"
            label={t('account.team_name_label')}
            value={profile?.teamName ?? '-'}
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="👥"
            label={t('account.team_members_label')}
            onPress={() => navigation.navigate('TeamMembers')}
          />
          {profile?.role === 'owner' && profile?.teamId ? (
            <>
              <View style={styles.rowSeparator} />
              <SettingsRow
                icon="✉️"
                label={t('account.invite_label')}
                onPress={handleInvite}
              />
            </>
          ) : null}
        </Section>

        {/* ── Settings ────────────────────────────────────────────────────── */}
        <Section title={t('account.section_settings')}>
          <SettingsRow
            icon="🌐"
            label={t('account.language_label')}
            rightElement={<LanguageSwitcher />}
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="🔑"
            label={t('account.change_password')}
            onPress={() => setPwModalVisible(true)}
          />
        </Section>

        {/* ── Support ─────────────────────────────────────────────────────── */}
        <Section title={t('account.section_support')}>
          <SettingsRow
            icon="🔒"
            label={t('account.privacy')}
            onPress={handlePrivacy}
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="📄"
            label={t('account.terms')}
            onPress={handleTerms}
          />
          <View style={styles.rowSeparator} />
          <SettingsRow
            icon="💬"
            label={t('account.contact')}
            onPress={handleSupport}
          />
        </Section>

        {/* ── Account ─────────────────────────────────────────────────────── */}
        <Section title={t('account.section_account')}>
          <SettingsRow
            icon="🚪"
            label={t('account.logout')}
            onPress={handleSignOut}
          />
          <View style={styles.rowSeparator} />
          {deletingAccount ? (
            <View style={[styles.row, styles.rowDeleteLoading]}>
              <ActivityIndicator color={palette.error} size="small" />
              <Text style={styles.deletingText}>{t('common.loading')}</Text>
            </View>
          ) : (
            <SettingsRow
              icon="🗑️"
              label={t('account.delete_account')}
              onPress={handleDeleteAccount}
              destructive
            />
          )}
        </Section>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <Text style={styles.versionText}>{t('account.version', { version: APP_VERSION })}</Text>
      </ScrollView>

      {/* ── Password change modal ────────────────────────────────────────── */}
      <PasswordChangeModal
        visible={pwModalVisible}
        onClose={() => setPwModalVisible(false)}
      />

      {/* ── Invite modal ────────────────────────────────────────────────── */}
      <InviteCodeModal
        visible={inviteModalVisible}
        teamId={profile?.teamId ?? null}
        teamName={profile?.teamName ?? null}
        onClose={() => setInviteModalVisible(false)}
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

  // Premium banner
  premiumBanner: {
    marginHorizontal: spacing['4'],
    marginTop: spacing['4'],
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  premiumBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    gap: spacing['3'],
  },
  premiumBannerEmoji: { fontSize: 24 },
  premiumBannerTitle: {
    color: '#fff',
    fontWeight: typography.weights.black,
    fontSize: typography.sizes.base,
  },
  premiumBannerDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  premiumBannerChevron: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
  },
  premiumActiveBadge: {
    marginHorizontal: spacing['4'],
    marginTop: spacing['4'],
    backgroundColor: palette.accentMuted,
    borderRadius: radii.xl,
    padding: spacing['3'],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.accent + '60',
  },
  premiumActiveBadgeText: {
    color: palette.accent,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },

  // Profile card
  profileCard: {
    margin: spacing['4'],
    backgroundColor: palette.bgCard,
    borderRadius: radii.xl,
    padding: spacing['6'],
    alignItems: 'center',
    ...shadows.md,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['3'],
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 30,
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
