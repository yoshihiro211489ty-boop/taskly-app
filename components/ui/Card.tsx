import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { palette, radii, shadows, spacing } from '../../lib/designTokens';

export interface CardProps {
  children: React.ReactNode;
  /** When provided the card becomes pressable. */
  onPress?: () => void;
  /** Inner padding. Defaults to spacing['4'] (16). */
  padding?: number;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, onPress, padding = spacing['4'], style }: CardProps) {
  const cardStyle: StyleProp<ViewStyle> = [
    styles.card,
    { padding },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.78}
        accessibilityRole="button"
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

Card.displayName = 'Card';

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.bgCard,
    borderRadius: radii.lg,
    ...shadows.sm,
  },
});
