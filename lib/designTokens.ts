/**
 * デザイントークン v3
 * パレット刷新: 深い藍ブルー + やわらかい青緑アクセント → Things 3 × Headspace の中間
 */

// ─── Palette ──────────────────────────────────────────────────────────────────

export const palette = {
  // Page / surface
  bgPage:   '#F5F7FC',
  bgCard:   '#FFFFFF',
  bgSubtle: '#EEF0FF',
  bgWash:   '#F9FAFF',

  // Brand blue (深い藍に近い、信頼感+落ち着き)
  navy:          '#162033',
  primary:       '#4F5DEB',
  primaryHover:  '#3F4DDA',
  primaryMuted:  '#EEF0FF',

  // Accent: やわらかい青緑（達成・成功）
  accent:      '#22C9A9',
  accentMuted: '#E6F9F4',
  accentWash:  '#F0FDFA',

  // Text
  text:       '#172033',
  textMuted:  '#526179',
  textSubtle: '#8793A8',

  // Borders
  border:      '#D7E0EE',
  borderLight: '#E8EEF7',

  // Shadows
  shadow: '#1A2E4A',

  // Status: success
  success:       '#059669',
  successBg:     '#E6F9F4',
  successBorder: '#6EE7B7',

  // Status: warning
  warningBg:     '#FFF7E6',
  warningBorder: '#F6C96B',
  warningText:   '#7A5516',

  // Status: error
  error:       '#DC2626',
  errorBg:     '#FEF2F2',
  errorBorder: '#F5B5B5',

  // Misc
  onInverse: '#FFFFFF',
  secondary: '#7C3AED',
  gold:      '#F59E0B',
  neutral:   '#98A2B3',
  disabled:  '#CBD5E1',

  // Calendar
  selectedDay: '#4F5DEB',
  saturday:    '#4F5DEB',
  sunday:      '#EF4444',
} as const;

// ─── Gradients ────────────────────────────────────────────────────────────────

export const gradients = {
  primary: ['#4F5DEB', '#7B8CFF'] as const,
  accent:  ['#22C9A9', '#5EE2C7'] as const,
  hero:    ['#EEF0FF', '#FFFFFF'] as const,
};

// ─── Card shadow (default) ────────────────────────────────────────────────────

export const cardShadow = {
  shadowColor: palette.shadow,
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────

export const typography = {
  sizes: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   24,
    '2xl': 28,
    '3xl': 34,
  },
  weights: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
    black:    '900' as const,
  },
  lineHeights: {
    tight:   1.2,
    normal:  1.5,
    relaxed: 1.8,
  },
};

// ─── Spacing (4pt grid) ───────────────────────────────────────────────────────

export const spacing = {
  '0':  0,
  '1':  4,
  '2':  8,
  '3':  12,
  '4':  16,
  '5':  20,
  '6':  24,
  '8':  32,
  '10': 40,
  '12': 48,
};

// ─── Border radius ────────────────────────────────────────────────────────────

export const radii = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// ─── Shadows (5 tiers) ────────────────────────────────────────────────────────

export const shadows = {
  xs: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  xl: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.18,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
};

// ─── Motion (animation curves) ────────────────────────────────────────────────

export const motion = {
  /** タップ反応: 弾むような跳ね返り */
  spring: { damping: 20, stiffness: 200 },
  /** フェードイン/アウト */
  easeOut: { duration: 300 },
  /** 成功時のはずみ */
  bounce: { damping: 12, stiffness: 180 },
  /** 軽快なスナップ */
  snap: { damping: 25, stiffness: 280 },
} as const;

// ─── Status badge colors ──────────────────────────────────────────────────────

export const statusColors = {
  todo:       { bg: '#F0F4FF', text: '#3B4ADB', border: '#C5D0FA' },
  inProgress: { bg: '#FFF3E0', text: '#D97706', border: '#FDE68A' },
  done:       { bg: '#ECFDF5', text: '#059669', border: '#6EE7B7' },
  daily:      { bg: '#F3F0FF', text: '#6741D9', border: '#D0BFFF' },
  weekly:     { bg: '#FFF0F6', text: '#C2255C', border: '#FFDEEB' },
  monthly:    { bg: '#E6FCF5', text: '#0CA678', border: '#96F2D7' },
};

// ─── Legacy compat ────────────────────────────────────────────────────────────

/** @deprecated Use palette directly */
export const timecardStatusColors = {
  出勤: '#4F5DEB',
  '有給（全日）': '#7C3AED',
  時間休: '#8B5CF6',
  公休: '#64748B',
  欠勤: '#DC2626',
  遅刻: '#F97316',
  早退: '#F97316',
} as const;

export const colors = palette;

export const theme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  motion,
  gradients,
  statusColors,
};

export type Theme = typeof theme;
