import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette, cardShadow, typography, spacing, radii } from '../../lib/designTokens';

type Props = {
  visible: boolean;
  teamId: string | null;
  teamName: string | null;
  onClose: () => void;
};

/** チームUUIDの先頭8文字を大文字化して招待コードにする */
function toInviteCode(teamId: string): string {
  return teamId.replace(/-/g, '').slice(0, 8).toUpperCase();
}

async function copyText(text: string): Promise<boolean> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
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
}

export function InviteCodeModal({ visible, teamId, teamName, onClose }: Props) {
  const { t } = useTranslation();
  const [justCopied, setJustCopied] = useState<'code' | 'link' | null>(null);

  if (!teamId) return null;
  const inviteCode = toInviteCode(teamId);
  const inviteLink = `taskly://join/${teamId}`;

  const handleCopyCode = async () => {
    const ok = await copyText(inviteCode);
    if (ok) {
      setJustCopied('code');
      setTimeout(() => setJustCopied(null), 1800);
    } else {
      Alert.alert(t('invite.copy_failed_title'), inviteCode);
    }
  };

  const handleCopyLink = async () => {
    const ok = await copyText(inviteLink);
    if (ok) {
      setJustCopied('link');
      setTimeout(() => setJustCopied(null), 1800);
    } else {
      Alert.alert(t('invite.copy_failed_title'), inviteLink);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
        accessibilityLabel={t('common.close')}
      />

      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <View style={styles.sheet}>
          <View style={styles.handleBar} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{t('invite.title')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {teamName ? (
              <View style={styles.teamBadge}>
                <Text style={styles.teamBadgeEmoji}>👥</Text>
                <Text style={styles.teamBadgeText}>{teamName}</Text>
              </View>
            ) : null}

            <Text style={styles.description}>{t('invite.description')}</Text>

            {/* 招待コード（大きく表示） */}
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>{t('invite.code_label')}</Text>
              <Text selectable style={styles.codeText}>{inviteCode}</Text>
              <TouchableOpacity
                style={[styles.copyBtn, justCopied === 'code' && styles.copyBtnDone]}
                onPress={handleCopyCode}
                activeOpacity={0.8}
              >
                <Text style={styles.copyBtnText}>
                  {justCopied === 'code' ? `✓ ${t('invite.copied')}` : `📋 ${t('invite.copy_code')}`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 手順 */}
            <View style={styles.steps}>
              <Text style={styles.stepsTitle}>{t('invite.how_to_title')}</Text>
              <Text style={styles.stepLine}>{t('invite.step_1')}</Text>
              <Text style={styles.stepLine}>{t('invite.step_2')}</Text>
              <Text style={styles.stepLine}>{t('invite.step_3')}</Text>
            </View>

            {/* 詳細：deep link (折り畳まずに薄く表示) */}
            <View style={styles.linkSection}>
              <Text style={styles.linkLabel}>{t('invite.deep_link_label')}</Text>
              <Text selectable style={styles.linkText} numberOfLines={1}>{inviteLink}</Text>
              <TouchableOpacity
                style={[styles.secondaryBtn, justCopied === 'link' && styles.secondaryBtnDone]}
                onPress={handleCopyLink}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryBtnText}>
                  {justCopied === 'link' ? `✓ ${t('invite.copied')}` : t('invite.copy_link')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22, 32, 51, 0.45)',
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.bgCard,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '92%',
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
  content: {
    padding: spacing['5'],
    gap: spacing['5'],
    paddingBottom: spacing['10'],
  },
  teamBadge: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: palette.bgSubtle,
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['2'],
    borderRadius: radii.full,
    gap: spacing['2'],
    borderWidth: 1,
    borderColor: palette.border,
  },
  teamBadgeEmoji: { fontSize: 18 },
  teamBadgeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: palette.primary,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    textAlign: 'center',
  },
  codeBox: {
    backgroundColor: palette.bgSubtle,
    borderRadius: radii.lg,
    padding: spacing['5'],
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.primary,
    gap: spacing['3'],
  },
  codeLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: palette.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  codeText: {
    fontSize: 40,
    fontWeight: '900',
    color: palette.primary,
    letterSpacing: 6,
  },
  copyBtn: {
    backgroundColor: palette.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing['5'],
    paddingVertical: spacing['3'],
    minWidth: 180,
    alignItems: 'center',
  },
  copyBtnDone: {
    backgroundColor: palette.success,
  },
  copyBtnText: {
    color: palette.onInverse,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  steps: {
    gap: spacing['2'],
    backgroundColor: palette.bgPage,
    padding: spacing['4'],
    borderRadius: radii.md,
  },
  stepsTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: palette.text,
    marginBottom: spacing['1'],
  },
  stepLine: {
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  linkSection: {
    gap: spacing['2'],
    paddingTop: spacing['3'],
    borderTopWidth: 1,
    borderTopColor: palette.borderLight,
  },
  linkLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: palette.textSubtle,
  },
  linkText: {
    fontSize: typography.sizes.xs,
    color: palette.textSubtle,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  secondaryBtn: {
    backgroundColor: palette.bgPage,
    borderWidth: 1.5,
    borderColor: palette.primary,
    borderRadius: radii.md,
    paddingVertical: spacing['3'],
    alignItems: 'center',
    marginTop: spacing['1'],
  },
  secondaryBtnDone: {
    borderColor: palette.success,
  },
  secondaryBtnText: {
    color: palette.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});
