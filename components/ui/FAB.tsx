import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, typography, radii, shadows, spacing, gradients, motion } from '../../lib/designTokens';

export interface FABProps {
  onPress: () => void;
  /** Icon character. Defaults to '+'. */
  icon?: string;
  /** Optional text label shown beside the icon. */
  label?: string;
}

export function FAB({ onPress, icon = '+', label }: FABProps) {
  const hasLabel = Boolean(label);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.fab, hasLabel ? styles.fabExtended : styles.fabRound, animStyle]}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, hasLabel ? styles.fabExtended : styles.fabRound]}
      />
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.91, motion.spring); }}
        onPressOut={() => { scale.value = withSpring(1, motion.spring); }}
        accessibilityRole="button"
        accessibilityLabel={label ?? '新規作成'}
        style={styles.pressable}
      >
        <View style={styles.inner}>
          <Text style={styles.icon}>{icon}</Text>
          {hasLabel && <Text style={styles.label}>{label}</Text>}
        </View>
      </Pressable>
    </Animated.View>
  );
}

FAB.displayName = 'FAB';

const FAB_SIZE = 56;

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: spacing['8'],
    right: spacing['5'],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
  pressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: typography.weights.bold,
  },
  label: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: palette.onInverse,
  },
});
