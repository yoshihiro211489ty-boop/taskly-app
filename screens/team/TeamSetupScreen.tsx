import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette, cardShadow, typography, spacing, radii } from '../../lib/designTokens';
import { useAuth } from '../../lib/AuthContext';
import { CreateTeamModal } from './CreateTeamModal';
import { JoinTeamModal } from './JoinTeamModal';

export function TeamSetupScreen() {
  const { t } = useTranslation();
  const { refreshProfile } = useAuth();
  const [createVisible, setCreateVisible] = useState(false);
  const [joinVisible, setJoinVisible] = useState(false);

  const handleCreated = async (_teamId: string, _teamName: string) => {
    await refreshProfile();
    setCreateVisible(false);
  };

  const handleJoined = async (_teamId: string, _teamName: string) => {
    await refreshProfile();
    setJoinVisible(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Illustration placeholder */}
      <View style={styles.illustrationContainer}>
        <Text style={styles.illustrationEmoji}>👥</Text>
      </View>

      {/* Title / subtitle */}
      <Text style={styles.title}>{t('team.setup_title')}</Text>
      <Text style={styles.subtitle}>{t('team.setup_subtitle')}</Text>

      {/* Action cards */}
      <View style={styles.cardsContainer}>
        {/* Create team card */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.82}
          onPress={() => setCreateVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t('team.create_card_title')}
        >
          <View style={[styles.cardIconBg, { backgroundColor: palette.primaryMuted }]}>
            <Text style={styles.cardIcon}>🏗️</Text>
          </View>
          <View style={styles.cardTextArea}>
            <Text style={styles.cardTitle}>{t('team.create_card_title')}</Text>
            <Text style={styles.cardDesc}>{t('team.create_card_desc')}</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>

        {/* Join team card */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.82}
          onPress={() => setJoinVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t('team.join_card_title')}
        >
          <View style={[styles.cardIconBg, { backgroundColor: palette.accentWash }]}>
            <Text style={styles.cardIcon}>🔗</Text>
          </View>
          <View style={styles.cardTextArea}>
            <Text style={styles.cardTitle}>{t('team.join_card_title')}</Text>
            <Text style={styles.cardDesc}>{t('team.join_card_desc')}</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <CreateTeamModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreated={handleCreated}
      />
      <JoinTeamModal
        visible={joinVisible}
        onClose={() => setJoinVisible(false)}
        onJoined={handleJoined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bgPage,
    alignItems: 'center',
    paddingHorizontal: spacing['5'],
  },

  // Illustration
  illustrationContainer: {
    marginTop: spacing['12'],
    width: 120,
    height: 120,
    borderRadius: radii.full,
    backgroundColor: palette.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['6'],
    ...cardShadow,
    shadowOpacity: 0.06,
  },
  illustrationEmoji: {
    fontSize: 56,
  },

  // Text
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: palette.text,
    textAlign: 'center',
    marginBottom: spacing['2'],
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: palette.textMuted,
    textAlign: 'center',
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
    marginBottom: spacing['8'],
    maxWidth: 280,
  },

  // Cards
  cardsContainer: {
    width: '100%',
    gap: spacing['4'],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.bgCard,
    borderRadius: radii.xl,
    padding: spacing['5'],
    ...cardShadow,
  },
  cardIconBg: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing['4'],
  },
  cardIcon: {
    fontSize: 26,
  },
  cardTextArea: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: palette.text,
    marginBottom: spacing['1'],
  },
  cardDesc: {
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
  cardArrow: {
    fontSize: 24,
    color: palette.textSubtle,
    fontWeight: typography.weights.bold,
    marginLeft: spacing['2'],
  },
});
