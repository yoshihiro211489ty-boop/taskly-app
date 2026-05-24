import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, typography, spacing } from '../../lib/designTokens';
import { Button } from './Button';

export interface EmptyStateProps {
  emoji: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
      {action ? (
        <View style={styles.actionWrap}>
          <Button
            label={action.label}
            onPress={action.onPress}
            variant="primary"
            size="md"
          />
        </View>
      ) : null}
    </View>
  );
}

EmptyState.displayName = 'EmptyState';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['8'],
    paddingVertical: spacing['12'],
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing['4'],
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: palette.text,
    textAlign: 'center',
    marginBottom: spacing['2'],
  },
  description: {
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
    marginBottom: spacing['4'],
  },
  actionWrap: {
    marginTop: spacing['2'],
    alignSelf: 'stretch',
  },
});
