import { wasteAccent, Palette } from './design';

describe('wasteAccent', () => {
  it('returns the matching accent for a known waste type', () => {
    expect(wasteAccent('plastic')).toBe(Palette.waste.plastic);
    expect(wasteAccent('food')).toBe(Palette.waste.food);
  });

  it('is case-insensitive', () => {
    expect(wasteAccent('METAL')).toBe(Palette.waste.metal);
  });

  it('falls back to metal for an unknown or missing type', () => {
    expect(wasteAccent('glass')).toBe(Palette.waste.metal);
    expect(wasteAccent(undefined)).toBe(Palette.waste.metal);
  });
});

// WCAG relative-luminance contrast ratio, to keep text colours readable.
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('text contrast (WCAG AA = 4.5:1)', () => {
  it('keeps placeholder/disabled text readable on the page background and on white', () => {
    expect(contrast(Palette.ink[300], Palette.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(Palette.ink[300], Palette.surface)).toBeGreaterThanOrEqual(4.5);
  });
  it('keeps muted label text readable', () => {
    expect(contrast(Palette.ink[500], Palette.background)).toBeGreaterThanOrEqual(4.5);
  });
});
