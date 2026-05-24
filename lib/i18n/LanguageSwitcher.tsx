import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { saveLanguage } from './index';
import type { Locale } from './types';

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
];

/**
 * LanguageSwitcher
 *
 * A simple pill-style toggle that lets the user switch between Japanese and
 * English.  Drop this into AccountScreen (or any settings surface) — no
 * external UI library required.
 *
 * Example usage:
 *   import { LanguageSwitcher } from '../lib/i18n/LanguageSwitcher';
 *   // inside a component:
 *   <LanguageSwitcher />
 */
export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language as Locale;

  const handlePress = async (code: Locale) => {
    if (code === current) return;
    await saveLanguage(code);
  };

  return (
    <View style={styles.container}>
      {LOCALES.map(({ code, label }) => {
        const active = code === current;
        return (
          <TouchableOpacity
            key={code}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => handlePress(code)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  pillActive: {
    backgroundColor: '#2563EB',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
});
