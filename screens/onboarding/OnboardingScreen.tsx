import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette, typography, spacing, radii } from '../../lib/designTokens';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  onComplete: () => void;
};

type Page = {
  key: string;
  emoji: string;
  title: string;
  body: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function OnboardingScreen({ onComplete }: Props) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);

  const PAGES: Page[] = useMemo(
    () => [
      {
        key: 'welcome',
        emoji: '📋',
        title: t('onboarding.page1_title'),
        body: t('onboarding.page1_body'),
      },
      {
        key: 'routines',
        emoji: '🔁',
        title: t('onboarding.page2_title'),
        body: t('onboarding.page2_body'),
      },
      {
        key: 'getstarted',
        emoji: '🎯',
        title: t('onboarding.page3_title'),
        body: t('onboarding.page3_body'),
      },
    ],
    [t],
  );

  const isLastPage = activeIndex === PAGES.length - 1;
  const currentPage = PAGES[activeIndex];

  const handleNext = useCallback(() => {
    if (isLastPage) {
      onComplete();
    } else {
      setActiveIndex((i) => Math.min(i + 1, PAGES.length - 1));
    }
  }, [isLastPage, onComplete, PAGES.length]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleDotPress = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      {/* Skip button — only on pages 0 and 1 */}
      <View style={styles.topBar}>
        {!isLastPage ? (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={handleSkip}
            hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
            accessibilityLabel={t('onboarding.skip')}
          >
            <Text style={styles.skipBtnText}>{t('onboarding.skip')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipBtnPlaceholder} />
        )}
      </View>

      {/* Current page */}
      <View style={styles.page}>
        <View style={styles.emojiContainer}>
          <Text style={styles.pageEmoji}>{currentPage.emoji}</Text>
        </View>
        <Text style={styles.pageTitle}>{currentPage.title}</Text>
        <Text style={styles.pageBody}>{currentPage.body}</Text>
      </View>

      {/* Bottom area */}
      <View style={styles.bottomArea}>
        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {PAGES.map((page, i) => (
            <TouchableOpacity
              key={page.key}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
              onPress={() => handleDotPress(i)}
              hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
              accessibilityLabel={`ページ ${i + 1}`}
            />
          ))}
        </View>

        {/* Navigation button */}
        <View style={styles.navButtonArea}>
          {!isLastPage ? (
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={handleNext}
              activeOpacity={0.82}
              accessibilityLabel={t('onboarding.next')}
            >
              <Text style={styles.nextBtnText}>{t('onboarding.next')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.startBtn}
              onPress={onComplete}
              activeOpacity={0.82}
              accessibilityLabel={t('onboarding.start')}
            >
              <Text style={styles.startBtnText}>{t('onboarding.start')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bgPage,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing['5'],
    paddingTop: spacing['3'],
    paddingBottom: spacing['2'],
    minHeight: 44,
  },
  skipBtn: {
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['2'],
  },
  skipBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: palette.textMuted,
  },
  skipBtnPlaceholder: {
    height: 32,
  },

  // Page
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['8'],
    paddingBottom: spacing['6'],
    gap: spacing['5'],
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: radii.full,
    backgroundColor: palette.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['4'],
  },
  pageEmoji: {
    fontSize: 56,
  },
  pageTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: palette.text,
    textAlign: 'center',
    lineHeight: typography.sizes['2xl'] * typography.lineHeights.tight,
  },
  pageBody: {
    fontSize: typography.sizes.base,
    color: palette.textMuted,
    textAlign: 'center',
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
    maxWidth: 300,
  },

  // Bottom area
  bottomArea: {
    paddingHorizontal: spacing['5'],
    paddingBottom: spacing['8'],
    gap: spacing['5'],
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: palette.disabled,
  },
  dotActive: {
    width: 24,
    backgroundColor: palette.primary,
  },
  navButtonArea: {
    width: '100%',
  },
  nextBtn: {
    backgroundColor: palette.bgCard,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: radii.lg,
    paddingVertical: spacing['4'],
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: palette.text,
  },
  startBtn: {
    backgroundColor: palette.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing['4'],
    alignItems: 'center',
  },
  startBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: palette.onInverse,
  },
});
