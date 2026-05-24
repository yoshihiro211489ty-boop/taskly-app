/**
 * 一般的なSaaSアプリに寄せたカラー・影のトークン。
 * 明るい背景、青系の主色、状態が直感的に分かる補助色で統一する。
 *
 * v2: typography, spacing, radii, shadows, statusColors, theme を追加。
 */
export const palette = {
  bgPage: '#F6F8FC',
  bgCard: '#FFFFFF',
  bgSubtle: '#EAF2FF',
  bgWash: '#F9FBFF',

  navy: '#162033',
  primary: '#2563EB',
  primaryMuted: '#EAF2FF',
  accent: '#14B8A6',
  accentWash: '#E6FFFA',

  text: '#172033',
  textMuted: '#526179',
  textSubtle: '#8793A8',

  border: '#D7E0EE',
  borderLight: '#E8EEF7',

  shadow: '#1E3A5F',

  success: '#059669',
  successBg: '#E8F8F1',
  successBorder: '#8BD9B7',

  warningBg: '#FFF7E6',
  warningBorder: '#F6C96B',
  warningText: '#7A5516',

  error: '#DC2626',
  errorBg: '#FEF2F2',
  errorBorder: '#F5B5B5',

  selectedDay: '#2563EB',
  saturday: '#2563EB',
  sunday: '#EF4444',

  /** 主色ボタン上の文字・アイコン反転用 */
  onInverse: '#FFFFFF',
  /** タブ・セカンダリ強調（店舗ビュー等） */
  secondary: '#7C3AED',
  /** 星評価・注意喚起のゴールド */
  gold: '#F59E0B',
  /** 未着手・ニュートラル */
  neutral: '#98A2B3',
  /** 無効・区切り */
  disabled: '#CBD5E1',
} as const;

/** 勤怠ステータス別のバッジ色（カレンダー・凡例・サマリーで共通） */
export const timecardStatusColors = {
  出勤: '#2563EB',
  '有給（全日）': '#7C3AED',
  時間休: '#8B5CF6',
  公休: '#64748B',
  欠勤: '#DC2626',
  遅刻: '#F97316',
  早退: '#F97316',
} as const;

export const cardShadow = {
  shadowColor: palette.shadow,
  shadowOpacity: 0.1,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────

export const typography = {
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 34,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
};

// ─── Spacing (4pt grid) ───────────────────────────────────────────────────────

export const spacing = {
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,
};

// ─── Border radius ────────────────────────────────────────────────────────────

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

// ─── Shadows (iOS + Android elevation) ───────────────────────────────────────

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
};

// ─── Status colors (matches badge system in TasksScreen) ─────────────────────

export const statusColors = {
  todo:       { bg: '#F0F4FF', text: '#3B5BDB', border: '#C5D0FA' },
  inProgress: { bg: '#FFF3E0', text: '#E67700', border: '#FFD8A8' },
  done:       { bg: '#EBFBEE', text: '#2B8A3E', border: '#B2F2BB' },
  daily:      { bg: '#F3F0FF', text: '#6741D9', border: '#D0BFFF' },
  weekly:     { bg: '#FFF0F6', text: '#C2255C', border: '#FFDEEB' },
  monthly:    { bg: '#E6FCF5', text: '#0CA678', border: '#96F2D7' },
};

// ─── Composed theme object ────────────────────────────────────────────────────

/** Convenience re-export of `palette` under the `colors` key for theme access. */
export const colors = palette;

export const theme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  statusColors,
};

export type Theme = typeof theme;
