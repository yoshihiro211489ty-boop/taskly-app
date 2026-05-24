import 'react-native-gesture-handler';
import { installAlertWebPolyfill } from './lib/alertWebPolyfill';
// i18n を最初に import すると lib/i18n/index.ts の top-level で init() が走る
import { loadSavedLanguage } from './lib/i18n';
import { useTranslation } from 'react-i18next';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { LoginScreen } from './screens/LoginScreen';
import { RootStack } from './navigation/RootStack';
import { TeamSetupScreen } from './screens/team/TeamSetupScreen';
import { OnboardingScreen } from './screens/onboarding/OnboardingScreen';
import { palette } from './lib/designTokens';

// React Native Web では Alert.alert がサイレントなのでアプリ起動前にポリフィルを入れる
installAlertWebPolyfill();
// 保存済みの言語設定を非同期で読み込む（戻り値は無視 — ロードされたら React の re-render が走る）
void loadSavedLanguage();

// Deep link config for taskly://join/:teamId
const linking = {
  prefixes: ['taskly://', 'https://your-domain.com'],
  config: {
    screens: {
      Main: {
        screens: {
          Account: 'account',
          Tasks: 'tasks',
          Routines: 'routines',
        },
      },
    },
  },
};

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.lang = 'ja';

  const vm = document.querySelector('meta[name="viewport"]');
  if (vm) {
    const c = vm.getAttribute('content') ?? '';
    if (!c.includes('viewport-fit'))
      vm.setAttribute('content', `${c}, viewport-fit=cover`);
  } else {
    const m = document.createElement('meta');
    m.name = 'viewport';
    m.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    document.head.appendChild(m);
  }

  const STYLE_ID = 'taskly-global-style';
  if (!document.getElementById(STYLE_ID)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800;900&display=swap';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      html, body, #root { height: 100%; margin: 0; padding: 0;
        font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif; }
      body { overflow: hidden; min-height: 100dvh; overscroll-behavior: none; }
      #root { display: flex; flex-direction: column; min-height: 100%; }
      * { font-family: inherit; -webkit-tap-highlight-color: transparent; }
    `;
    document.head.appendChild(style);
  }
}

const ONBOARDING_KEY = 'taskly_has_seen_onboarding';

function RootRouter() {
  const { session, profile, loading, profileLoading, profileError, signOut, passwordRecoveryMode } =
    useAuth();
  const { t } = useTranslation();

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setHasSeenOnboarding(val === 'true');
      setOnboardingChecked(true);
    });
  }, []);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setHasSeenOnboarding(true);
  };

  // Auth / profile loading
  if (loading || !onboardingChecked) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  if (!session || passwordRecoveryMode) return <LoginScreen />;

  if (profileLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.centerText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          {profileError ?? t('errors.profile_not_found')}
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={signOut}>
          <Text style={styles.retryText}>{t('account.logout')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // First-time onboarding (shown once per install)
  if (!hasSeenOnboarding) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  // Team setup (shown whenever user has no team)
  // TeamSetupScreen calls refreshProfile() internally after creation/join,
  // which updates profile in context and triggers re-render here automatically.
  if (!profile.teamId) {
    return <TeamSetupScreen />;
  }

  return (
    <NavigationContainer linking={linking}>
      <RootStack />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootRouter />
        <StatusBar style="dark" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: palette.bgPage,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerText: { marginTop: 12, color: palette.textMuted, fontSize: 14 },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.primary,
  },
  retryText: { color: palette.primary, fontWeight: '600' },
});
