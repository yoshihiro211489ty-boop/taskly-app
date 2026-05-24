import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/AuthContext';
import { palette } from '../lib/designTokens';

type Step = 'email' | 'code';

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
        {/* Logo */}
        <View style={styles.logoArea}>
          <Text style={styles.appName}>{t('auth.app_name')}</Text>
          <Text style={styles.appSub}>{t('auth.app_sub')}</Text>
          <Text style={styles.tagline}>{t('auth.tagline')}</Text>
        </View>

        {/* Guest login */}
        <View style={styles.guestCard}>
          <Text style={styles.guestTitle}>{t('auth.guest_card_title')}</Text>
          <Text style={styles.guestDesc}>{t('auth.guest_card_desc')}</Text>
          <TouchableOpacity
            style={[styles.guestBtn, guestLoading && styles.primaryBtnDisabled]}
            onPress={handleGuestLogin}
            disabled={guestLoading || loading}
          >
            {guestLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.guestBtnText}>{t('auth.guest_button')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('auth.or_divider')}</Text>
          <View style={styles.dividerLine} />
        </View>

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

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleSend}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>{t('auth.send_code')}</Text>
                )}
              </TouchableOpacity>
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

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>{t('auth.verify_button')}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleResend}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={palette.primary} />
                ) : (
                  <Text style={styles.secondaryBtnText}>{t('auth.resend_code')}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => { setStep('email'); setError(null); setCode(''); }}
              >
                <Text style={styles.backBtnText}>{t('auth.back_change_email')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bgPage },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: palette.primary,
    letterSpacing: -1,
  },
  appSub: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textSubtle,
    marginTop: -4,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13,
    color: palette.textMuted,
  },
  card: {
    backgroundColor: palette.bgCard,
    borderRadius: 20,
    padding: 24,
    shadowColor: palette.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  sentEmoji: {
    fontSize: 44,
    textAlign: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.text,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: palette.textMuted,
    lineHeight: 22,
    marginBottom: 24,
  },
  emailHighlight: {
    color: palette.text,
    fontWeight: '700',
  },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textMuted,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: palette.bgPage,
    color: palette.text,
  },
  codeInput: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    paddingVertical: 16,
  },
  errorBox: {
    backgroundColor: palette.errorBg,
    borderColor: palette.errorBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: palette.error, fontSize: 13 },
  primaryBtn: {
    backgroundColor: palette.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: palette.primary,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryBtnText: {
    color: palette.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backBtnText: {
    color: palette.textSubtle,
    fontSize: 13,
  },
  guestCard: {
    backgroundColor: palette.bgCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: palette.primary,
    shadowColor: palette.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  guestTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.text,
    marginBottom: 6,
  },
  guestDesc: {
    fontSize: 13,
    color: palette.textMuted,
    marginBottom: 14,
    lineHeight: 19,
  },
  guestBtn: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  guestBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.border,
  },
  dividerText: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
  },
});
