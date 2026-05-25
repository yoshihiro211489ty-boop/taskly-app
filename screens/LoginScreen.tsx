import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/AuthContext';
import {
  palette,
  gradients,
  radii,
  shadows,
  spacing,
  typography,
  motion,
} from '../lib/designTokens';

type Step = 'email' | 'code';

// ─── Spring-animated press wrapper ───────────────────────────────────────────

function PressBtn({
  onPress,
  disabled,
  children,
}: {
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
  }));
  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, motion.spring); }}
        onPressOut={() => { scale.value = withSpring(1, motion.spring); }}
        disabled={disabled}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function LoginScreen() {
  const { t } = useTranslation();
  const { sendOtp, verifyOtp, signInAsGuest } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGuestLogin = async () => {
    setError(null);
    setGuestLoading(true);
    const result = await signInAsGuest();
    setGuestLoading(false);
    if (result.error) setError(result.error);
  };

  const handleSend = async () => {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError(t('auth.validation_email_invalid'));
      return;
    }
    setLoading(true);
    const result = await sendOtp(trimmed);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setStep('code');
    }
  };

  const handleVerify = async () => {
    setError(null);
    const trimmedCode = code.trim();
    if (!trimmedCode || trimmedCode.length < 6) {
      setError(t('auth.validation_code_short'));
      return;
    }
    setLoading(true);
    const result = await verifyOtp(email.trim(), trimmedCode);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    }
    // 成功時: AuthContext が session を更新 → アプリが自動的に次画面へ遷移
  };

  const handleResend = async () => {
    setError(null);
    setLoading(true);
    const result = await sendOtp(email.trim());
    setLoading(false);
    if (result.error) setError(result.error);
    else setCode('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── ロゴエリア ──────────────────────────────────────── */}
        <View style={styles.logoArea}>
          <View style={styles.logoMark}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.logoMarkText}>✓</Text>
          </View>
          <Text style={styles.appName}>{t('auth.app_name')}</Text>
          <Text style={styles.appSub}>{t('auth.app_sub')}</Text>
          <Text style={styles.tagline}>{t('auth.tagline')}</Text>
        </View>

        {/* ── ゲストカード ─────────────────────────────────────── */}
        <View style={styles.guestCard}>
          {/* 左のアクセントバー */}
          <View style={styles.guestAccentBar} />
          <View style={styles.guestCardBody}>
            <Text style={styles.guestTitle}>{t('auth.guest_card_title')}</Text>
            <Text style={styles.guestDesc}>{t('auth.guest_card_desc')}</Text>
            <PressBtn onPress={handleGuestLogin} disabled={guestLoading || loading}>
              <View style={styles.guestBtn}>
                {guestLoading ? (
                  <ActivityIndicator color={palette.accent} />
                ) : (
                  <Text style={styles.guestBtnText}>{t('auth.guest_button')}</Text>
                )}
              </View>
            </PressBtn>
          </View>
        </View>

        {/* ── 区切り ────────────────────────────────────────────── */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('auth.or_divider')}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ── メインカード ─────────────────────────────────────── */}
        <View style={styles.card}>
          {step === 'email' ? (
            <>
              <Text style={styles.cardTitle}>{t('auth.email_login_title')}</Text>
              <Text style={styles.cardDesc}>{t('auth.email_login_desc')}</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.email_label')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.email_placeholder')}
                  placeholderTextColor={palette.textSubtle}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                />
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <PressBtn onPress={handleSend} disabled={loading}>
                <View style={styles.gradientBtn}>
                  <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: radii.lg }]}
                  />
                  {loading ? (
                    <ActivityIndicator color={palette.onInverse} />
                  ) : (
                    <Text style={styles.gradientBtnText}>{t('auth.send_code')}</Text>
                  )}
                </View>
              </PressBtn>
            </>
          ) : (
            <>
              <Text style={styles.sentEmoji}>📬</Text>
              <Text style={styles.cardTitle}>{t('auth.code_title')}</Text>
              <Text style={styles.cardDesc}>{t('auth.code_desc', { email })}</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.code_label')}</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder={t('auth.code_placeholder')}
                  placeholderTextColor={palette.textSubtle}
                  value={code}
                  onChangeText={(txt) => setCode(txt.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="done"
                  onSubmitEditing={handleVerify}
                  autoFocus
                />
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <PressBtn onPress={handleVerify} disabled={loading}>
                <View style={styles.gradientBtn}>
                  <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: radii.lg }]}
                  />
                  {loading ? (
                    <ActivityIndicator color={palette.onInverse} />
                  ) : (
                    <Text style={styles.gradientBtnText}>{t('auth.verify_button')}</Text>
                  )}
                </View>
              </PressBtn>

              <PressBtn onPress={handleResend} disabled={loading}>
                <View style={styles.outlineBtn}>
                  {loading ? (
                    <ActivityIndicator color={palette.primary} />
                  ) : (
                    <Text style={styles.outlineBtnText}>{t('auth.resend_code')}</Text>
                  )}
                </View>
              </PressBtn>

              <Pressable
                style={styles.ghostBtn}
                onPress={() => { setStep('email'); setError(null); setCode(''); }}
              >
                <Text style={styles.ghostBtnText}>{t('auth.back_change_email')}</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bgPage },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['5'],
    paddingVertical: spacing['8'],
  },

  // Header
  logoArea: {
    alignItems: 'center',
    marginBottom: spacing['8'],
  },
  logoMark: {
    width: 60,
    height: 60,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing['3'],
    ...shadows.md,
  },
  logoMarkText: {
    fontSize: 30,
    color: palette.onInverse,
    fontWeight: '900',
    lineHeight: 36,
  },
  appName: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.black,
    color: palette.navy,
    letterSpacing: -1.5,
  },
  appSub: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: palette.textSubtle,
    marginTop: -2,
    marginBottom: spacing['2'],
  },
  tagline: {
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
  },

  // Guest card
  guestCard: {
    flexDirection: 'row',
    backgroundColor: palette.bgCard,
    borderRadius: radii['2xl'],
    marginBottom: spacing['4'],
    overflow: 'hidden',
    ...shadows.sm,
  },
  guestAccentBar: {
    width: 4,
    backgroundColor: palette.accent,
  },
  guestCardBody: {
    flex: 1,
    padding: spacing['5'],
  },
  guestTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: palette.text,
    marginBottom: spacing['1'],
  },
  guestDesc: {
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    lineHeight: typography.sizes.sm * 1.7,
    marginBottom: spacing['4'],
  },
  guestBtn: {
    backgroundColor: palette.accentMuted,
    borderRadius: radii.md,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: palette.accent,
  },
  guestBtnText: {
    color: palette.accent,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing['3'],
    paddingHorizontal: spacing['1'],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.borderLight,
  },
  dividerText: {
    color: palette.textSubtle,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    paddingHorizontal: spacing['3'],
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  // Main card
  card: {
    backgroundColor: palette.bgCard,
    borderRadius: radii['2xl'],
    padding: spacing['6'],
    ...shadows.md,
  },
  sentEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: spacing['3'],
  },
  cardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: palette.text,
    marginBottom: spacing['2'],
  },
  cardDesc: {
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    lineHeight: typography.sizes.sm * 1.7,
    marginBottom: spacing['6'],
  },

  // Input
  inputGroup: { marginBottom: spacing['4'] },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: palette.textMuted,
    marginBottom: spacing['2'],
  },
  input: {
    borderWidth: 1.5,
    borderColor: palette.borderLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing['4'],
    paddingVertical: 13,
    fontSize: typography.sizes.base,
    backgroundColor: palette.bgWash,
    color: palette.text,
  },
  codeInput: {
    fontSize: 32,
    fontWeight: typography.weights.bold,
    letterSpacing: 10,
    textAlign: 'center',
    paddingVertical: spacing['5'],
    borderColor: palette.primary,
    backgroundColor: palette.primaryMuted,
  },

  // Error
  errorBox: {
    backgroundColor: palette.errorBg,
    borderColor: palette.errorBorder,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing['3'],
    marginBottom: spacing['4'],
  },
  errorText: { color: palette.error, fontSize: typography.sizes.sm },

  // Buttons
  gradientBtn: {
    borderRadius: radii.lg,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing['2'],
  },
  gradientBtnText: {
    color: palette.onInverse,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: palette.primary,
    borderRadius: radii.lg,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: spacing['3'],
    backgroundColor: palette.primaryMuted,
  },
  outlineBtnText: {
    color: palette.primary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  ghostBtn: {
    alignItems: 'center',
    paddingVertical: spacing['2'],
  },
  ghostBtnText: {
    color: palette.textSubtle,
    fontSize: typography.sizes.sm,
  },
});
