import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette, typography, radii, shadows, spacing } from '../../lib/designTokens';

export interface FABProps {
  onPress: () => void;
  /** Icon character. Defaults to '+'. */
  icon?: string;
  /** Optional text label shown beside the icon. */
  label?: string;
}

export function FAB({ onPress, icon = '+', label }: FABProps) {
  const hasLabel = Boolean(label);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label ?? '新規作成'}
      style={[
        styles.fab,
        hasLabel ? styles.fabExtended : styles.fabRound,
      ]}
    >
      <View style={styles.inner}>
        <Text style={styles.icon}>{icon}</Text>
        {hasLabel ? (
          <Text style={styles.label}>{label}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

FAB.displayName = 'FAB';

const FAB_SIZE = 56;

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: spacing['8'],
    right: spacing['5'],
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  fabRound: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
  },
  fabExtended: {
    height: FAB_SIZE,
    paddingHorizontal: spacing['5'],
    borderRadius: radii.full,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
  },
  icon: {
    fontSize: typography.sizes.xl,
    color: palette.onInverse,
    lineHeight: typography.sizes.xl * 1.2,
    fontWeight: typography.weights.regular,
  },
  label: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: palette.onInverse,
  },
});
