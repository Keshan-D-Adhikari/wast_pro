// This file is the single place for the app's look: colours, spacing, corner radius,
// shadows and text styles. Every screen and every component in components/ui imports from here.
// Why: if you change a colour here, the whole app changes. Use these values, not raw numbers.
// 'as const' tells TypeScript the values never change, so it can check names like Space.md.

/**
 * SmartWaste Pro design tokens.
 *
 * Every screen pulls colour, spacing, radius, shadow and type from here so the
 * app stays visually consistent. Prefer adding a token over hardcoding a value.
 */

/* ================= COLOURS ================= */

// All colours. Use it like Palette.brand[600] or Palette.status.danger.base.
export const Palette = {
  // Numbers (900 dark ... 50 very light) are shades of the same colour.
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

  // 'base' is the strong colour (icons, text). 'tint' is a soft background of the same colour.
  /** Per-waste-type accents: plastic blue, food green, metal orange */
  waste: {
    plastic: { base: '#2E7CD6', tint: '#E7F1FC' },
    food: { base: '#2E9E4F', tint: '#E4F4E8' },
    metal: { base: '#E07B1A', tint: '#FDF0E1' },
  },

  // Same idea: base = strong colour, tint = light background. Used by Badge, Notice and bin status.
  /** Semantic status colours */
  status: {
    success: { base: '#2E7D32', tint: '#E6F3E7' },
    warning: { base: '#B45309', tint: '#FDF3E3' },
    danger: { base: '#C2352F', tint: '#FBEAE9' },
    info: { base: '#1565C0', tint: '#E6EFFA' },
    neutral: { base: '#5E6B60', tint: '#EDF2EA' },
  },

  // Gold colour for rewards and star ratings.
  reward: '#F0B429',
  white: '#FFFFFF',
} as const;

// These types are built from the Palette object, so they stay in sync automatically.
// WasteType = 'plastic' | 'food' | 'metal'. StatusTone = 'success' | 'warning' | ...
export type WasteType = keyof typeof Palette.waste;
export type StatusTone = keyof typeof Palette.status;

// In: a waste type text like 'Plastic'. Out: its { base, tint } colours.
/** Accent for a waste type, falling back to metal for unknown values. */
export const wasteAccent = (type?: string) =>
  Palette.waste[(type || '').toLowerCase() as WasteType] ?? Palette.waste.metal;

/* ================= SPACING ================= */

// Gaps and paddings. Example: Space.md is 12 pixels. '2xl' needs quotes because it starts with a number.
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

// How round corners are. 'pill' (999) makes fully round ends, used by buttons and badges.
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
// Spread these into a style: ...Shadow[2]. iOS uses the shadow* fields, Android uses 'elevation'.
// shadowOffset moves the shadow down, shadowRadius makes it softer, shadowOpacity makes it lighter.
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

// Ready-made text styles. Use like <Text style={Type.h1}>. Spread to tweak: { ...Type.small, color: 'red' }.
// lineHeight is the height of one line of text.
export const Type = {
  /** Screen titles */
  h1: { fontSize: 30, fontWeight: '800' as const, lineHeight: 36, color: Palette.ink[900] },
  /** Card titles, modal titles */
  h2: { fontSize: 23, fontWeight: '700' as const, lineHeight: 29, color: Palette.ink[900] },
  /** Section headings */
  h3: { fontSize: 20, fontWeight: '700' as const, lineHeight: 25, color: Palette.ink[900] },
  /** Default body copy */
  body: { fontSize: 18, fontWeight: '400' as const, lineHeight: 25, color: Palette.ink[700] },
  bodyStrong: { fontSize: 18, fontWeight: '600' as const, lineHeight: 25, color: Palette.ink[900] },
  /** Secondary copy, list metadata */
  small: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22, color: Palette.ink[500] },
  smallStrong: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22, color: Palette.ink[700] },
  /** Field labels, badges */
  caption: { fontSize: 14, fontWeight: '600' as const, lineHeight: 18, color: Palette.ink[500] },
  /** Numeric emphasis — prices, stats */
  metric: { fontSize: 26, fontWeight: '800' as const, lineHeight: 31, color: Palette.brand[600] },
} as const;

// Screens add this much bottom padding so content is not hidden behind the nav bar.
/** Height reserved for the fixed bottom navigation bar. */
export const BOTTOM_NAV_HEIGHT = 64;
