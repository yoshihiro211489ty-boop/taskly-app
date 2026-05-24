import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ja } from './locales/ja';
import { en } from './locales/en';

const LANGUAGE_KEY = 'app_language';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      ja: { translation: ja },
      en: { translation: en },
    },
    lng: 'ja',
    fallbackLng: 'ja',
    interpolation: {
      escapeValue: false,
    },
  });

/**
 * Loads the user's saved language preference from AsyncStorage and applies it.
 * Call this once at app startup (e.g. in App.tsx before rendering).
 */
export const loadSavedLanguage = async (): Promise<void> => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved && saved !== i18n.language) {
      await i18n.changeLanguage(saved);
    }
  } catch {
    // AsyncStorage unavailable — fall back to default ('ja')
  }
};

/**
 * Persists the chosen language to AsyncStorage and immediately applies it.
 */
export const saveLanguage = async (lng: string): Promise<void> => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  await i18n.changeLanguage(lng);
};

export { useTranslation } from 'react-i18next';
export default i18n;
