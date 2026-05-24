import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
  type TextInputProps as RNTextInputProps,
} from 'react-native';
import { palette, typography, radii, spacing } from '../../lib/designTokens';

export interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
}

export function TextInput({ label, error, style, ...rest }: TextInputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? palette.error
    : focused
    ? palette.primary
    : palette.border;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}

      <RNTextInput
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        placeholderTextColor={palette.textSubtle}
        style={[
          styles.input,
          { borderColor },
          focused && styles.inputFocused,
          style,
        ]}
      />

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
    </View>
  );
}

TextInput.displayName = 'TextInput';

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing['1'],
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: palette.text,
    marginBottom: spacing['1'],
  },
  input: {
    backgroundColor: palette.bgCard,
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    fontSize: typography.sizes.base,
    color: palette.text,
  },
  inputFocused: {
    backgroundColor: palette.bgWash,
  },
  error: {
    fontSize: typography.sizes.xs,
    color: palette.error,
    marginTop: spacing['1'],
  },
});
