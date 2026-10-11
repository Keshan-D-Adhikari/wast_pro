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
    300: '#687565', // placeholders, disabled (4.5:1 on the page background, WCAG AA)
    200: '#D9E1D6', // borders
    100: '#EDF2EA', // dividers, track fills
  },

  surface: '#FFFFFF',
  background: '#F4F8F2',
  overlay: 'rgba(20, 38, 26, 0.55)',

  /** Per-waste-type accents: plastic blue, food green, metal orange */
  waste: {
    plastic: { base: '#2E7CD6', tint: '#E7F1FC' },
    food: { base: '#2E9E4F', tint: '#E4F4E8' },
    metal: { base: '#E07B1A', tint: '#FDF0E1' },
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
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  2: {
    shadowColor: '#14261A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 4,
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
  h1: { fontSize: 28, fontWeight: '800' as const, lineHeight: 34, color: Palette.ink[900] },
  /** Card titles, modal titles */
  h2: { fontSize: 21, fontWeight: '700' as const, lineHeight: 27, color: Palette.ink[900] },
  /** Section headings */
  h3: { fontSize: 18, fontWeight: '700' as const, lineHeight: 23, color: Palette.ink[900] },
  /** Default body copy */
  body: { fontSize: 17, fontWeight: '400' as const, lineHeight: 23, color: Palette.ink[700] },
  bodyStrong: { fontSize: 17, fontWeight: '600' as const, lineHeight: 23, color: Palette.ink[900] },
  /** Secondary copy, list metadata */
  small: { fontSize: 15, fontWeight: '400' as const, lineHeight: 20, color: Palette.ink[500] },
  smallStrong: { fontSize: 15, fontWeight: '600' as const, lineHeight: 20, color: Palette.ink[700] },
  /** Field labels, badges */
  caption: { fontSize: 13, fontWeight: '600' as const, lineHeight: 17, color: Palette.ink[500] },
  /** Numeric emphasis — prices, stats */
  metric: { fontSize: 24, fontWeight: '800' as const, lineHeight: 29, color: Palette.brand[600] },
} as const;

/** Height reserved for the fixed bottom navigation bar. */
export const BOTTOM_NAV_HEIGHT = 64;
