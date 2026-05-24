import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { statusColors, typography, radii, spacing, palette } from '../../lib/designTokens';

export type BadgeVariant =
  | 'todo'
  | 'inProgress'
  | 'done'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'owner'
  | 'member';

export interface BadgeProps {
  label: string;
  variant: BadgeVariant;
}

/** Extra colors for role badges not covered by statusColors. */
const roleColors: Record<'owner' | 'member', { bg: string; text: string; border: string }> = {
  owner: {
    bg: palette.accentWash,
    text: palette.accent,
    border: palette.accent + '44',
  },
  member: {
    bg: palette.bgSubtle,
    text: palette.primary,
    border: palette.border,
  },
};

function getColors(variant: BadgeVariant) {
  if (variant === 'owner' || variant === 'member') {
    return roleColors[variant];
  }
  return statusColors[variant];
}

export function Badge({ label, variant }: BadgeProps) {
  const c = getColors(variant);

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: c.bg,
          borderColor: c.border,
        },
      ]}
    >
      <Text style={[styles.text, { color: c.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

Badge.displayName = 'Badge';

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing['3'],
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  text: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
});
