import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { palette, typography, radii, spacing } from '../../lib/designTokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const variantStyles: Record<
  ButtonVariant,
  { bg: string; text: string; borderColor: string; borderWidth: number }
> = {
  primary: {
    bg: palette.primary,
    text: palette.onInverse,
    borderColor: palette.primary,
    borderWidth: 0,
  },
  secondary: {
    bg: palette.bgCard,
    text: palette.primary,
    borderColor: palette.primary,
    borderWidth: 1.5,
  },
  ghost: {
    bg: 'transparent',
    text: palette.textMuted,
    borderColor: palette.border,
    borderWidth: 1,
  },
  danger: {
    bg: palette.errorBg,
    text: palette.error,
    borderColor: palette.errorBorder,
    borderWidth: 1,
  },
};

const sizeStyles: Record<
  ButtonSize,
  { paddingVertical: number; paddingHorizontal: number; fontSize: number; gap: number }
> = {
  sm: {
    paddingVertical: spacing['2'],
    paddingHorizontal: spacing['3'],
    fontSize: typography.sizes.sm,
    gap: spacing['1'],
  },
  md: {
    paddingVertical: spacing['3'],
    paddingHorizontal: spacing['5'],
    fontSize: typography.sizes.base,
    gap: spacing['2'],
  },
  lg: {
    paddingVertical: spacing['4'],
    paddingHorizontal: spacing['6'],
    fontSize: typography.sizes.md,
    gap: spacing['2'],
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.72}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={label}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.borderColor,
          borderWidth: v.borderWidth,
          borderRadius: radii.md,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          opacity: isDisabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      <View style={[styles.inner, { gap: s.gap }]}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={v.text}
            style={styles.spinner}
          />
        ) : leftIcon ? (
          <View style={styles.iconWrap}>{leftIcon}</View>
        ) : null}

        <Text
          style={[
            styles.label,
            { color: v.text, fontSize: s.fontSize },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>

        {!loading && rightIcon ? (
          <View style={styles.iconWrap}>{rightIcon}</View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

Button.displayName = 'Button';

const styles = StyleSheet.create({
  base: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: typography.weights.semibold,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    // small offset so the spinner visually aligns with the text baseline
  },
});
