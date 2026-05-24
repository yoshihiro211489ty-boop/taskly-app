import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { typography } from '../../lib/designTokens';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  name: string;
  size?: AvatarSize;
  imageUrl?: string;
}

const sizeMap: Record<AvatarSize, { diameter: number; fontSize: number }> = {
  sm: { diameter: 32, fontSize: typography.sizes.sm },
  md: { diameter: 48, fontSize: typography.sizes.md },
  lg: { diameter: 72, fontSize: typography.sizes.xl },
};

/**
 * Generates a stable background color from a name string.
 * Uses a simple djb2-style hash to pick from a curated palette.
 */
function getAvatarColor(name: string): string {
  const colors = [
    '#3B5BDB', // blue
    '#6741D9', // purple
    '#C2255C', // pink
    '#0CA678', // teal
    '#E67700', // orange
    '#2B8A3E', // green
    '#1971C2', // mid-blue
    '#862E9C', // violet
  ];
  let hash = 5381;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 33) ^ name.charCodeAt(i);
  }
  return colors[Math.abs(hash) % colors.length];
}

/** Returns up to 2 uppercase initials from a name. */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({ name, size = 'md', imageUrl }: AvatarProps) {
  const { diameter, fontSize } = sizeMap[size];
  const bg = getAvatarColor(name);
  const initials = getInitials(name);

  const circleStyle = {
    width: diameter,
    height: diameter,
    borderRadius: diameter / 2,
  };

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, circleStyle]}
        accessibilityLabel={`${name}のアバター`}
      />
    );
  }

  return (
    <View
      style={[styles.circle, circleStyle, { backgroundColor: bg }]}
      accessibilityLabel={`${name}のアバター`}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

Avatar.displayName = 'Avatar';

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  image: {
    resizeMode: 'cover',
  },
});
