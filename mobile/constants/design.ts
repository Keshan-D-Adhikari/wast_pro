/**
 * SmartWaste Pro design tokens.
 *
 * Every screen pulls colour, spacing, radius, shadow and type from here so the
 * app stays visually consistent. Prefer adding a token over hardcoding a value.
 */

/* ================= COLOURS ================= */

export const Palette = {
  /** Brand green — the app's primary identity */
  brand: {
    900: '#1B4332',
    700: '#31572C',
    600: '#4F772D', // primary actions
    500: '#6A9A3D',
    200: '#C9DEBB',
    100: '#E4EEDC',
    50: '#F1F7ED',
  },

  /** Neutral greens/greys used for text and surfaces */
  ink: {
    900: '#14261A', // headings
    700: '#33443A', // body
    500: '#5E6B60', // muted labels
    300: '#93A08F', // placeholders, disabled
    200: '#D9E1D6', // borders
    100: '#EDF2EA', // dividers, track fills
  },

  surface: '#FFFFFF',
  background: '#F4F8F2',
  overlay: 'rgba(20, 38, 26, 0.55)',

  /** Per-waste-type accents, kept distinct so bins stay recognisable */
  waste: {
    plastic: { base: '#2E7CD6', tint: '#E7F1FC' },
    food: { base: '#E8853B', tint: '#FDF0E4' },
    metal: { base: '#7B8794', tint: '#EEF1F4' },
  },

  /** Semantic status colours */
  status: {
    success: { base: '#2E7D32', tint: '#E6F3E7' },
    warning: { base: '#B45309', tint: '#FDF3E3' },
    danger: { base: '#C2352F', tint: '#FBEAE9' },
    info: { base: '#1565C0', tint: '#E6EFFA' },
    neutral: { base: '#5E6B60', tint: '#EDF2EA' },
  },

  reward: '#F0B429',
  white: '#FFFFFF',
} as const;

export type WasteType = keyof typeof Palette.waste;
export type StatusTone = keyof typeof Palette.status;

/** Accent for a waste type, falling back to metal for unknown values. */
export const wasteAccent = (type?: string) =>
  Palette.waste[(type || '').toLowerCase() as WasteType] ?? Palette.waste.metal;

/* ================= SPACING ================= */

/** 4pt rhythm — use these instead of arbitrary margins. */
export const Space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

/* ================= SHAPE ================= */

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

/* ================= ELEVATION ================= */

/**
 * Soft, low-opacity shadows. Level 1 for resting cards, 2 for raised cards
 * and sheets, 3 for floating elements like modals.
 */
export const Shadow = {
  none: {},
  1: {
    shadowColor: '#14261A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  2: {
    shadowColor: '#14261A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  3: {
    shadowColor: '#14261A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

/* ================= TYPOGRAPHY ================= */

export const Type = {
  /** Screen titles */
  h1: { fontSize: 26, fontWeight: '800' as const, lineHeight: 32, color: Palette.ink[900] },
  /** Card titles, modal titles */
  h2: { fontSize: 19, fontWeight: '700' as const, lineHeight: 25, color: Palette.ink[900] },
  /** Section headings */
  h3: { fontSize: 16, fontWeight: '700' as const, lineHeight: 21, color: Palette.ink[900] },
  /** Default body copy */
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 21, color: Palette.ink[700] },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const, lineHeight: 21, color: Palette.ink[900] },
  /** Secondary copy, list metadata */
  small: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18, color: Palette.ink[500] },
  smallStrong: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18, color: Palette.ink[700] },
  /** Field labels, badges */
  caption: { fontSize: 11, fontWeight: '600' as const, lineHeight: 15, color: Palette.ink[500] },
  /** Numeric emphasis — prices, stats */
  metric: { fontSize: 22, fontWeight: '800' as const, lineHeight: 27, color: Palette.brand[600] },
} as const;

/** Height reserved for the fixed bottom navigation bar. */
export const BOTTOM_NAV_HEIGHT = 64;
