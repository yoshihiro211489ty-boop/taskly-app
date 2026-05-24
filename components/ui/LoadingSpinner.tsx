import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { palette, typography, spacing } from '../../lib/designTokens';

export interface LoadingSpinnerProps {
  /** When true, fills the screen with a centred spinner. Defaults to false. */
  fullScreen?: boolean;
  /** Optional text displayed below the spinner. */
  message?: string;
}

export function LoadingSpinner({ fullScreen = false, message }: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={palette.primary} />
      {message ? (
        <Text style={styles.message}>{message}</Text>
      ) : null}
    </View>
  );
}

LoadingSpinner.displayName = 'LoadingSpinner';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['6'],
  },
  fullScreen: {
    flex: 1,
    backgroundColor: palette.bgPage,
  },
  message: {
    marginTop: spacing['3'],
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    textAlign: 'center',
  },
});
