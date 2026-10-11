export type DonutSlice = { value: number; fraction: number; percent: number; dash: number; offset: number };

/**
 * Splits a ring of the given circumference into one slice per value.
 * Empty (zero) slices get no arc. When more than one slice is drawn, each is
 * shortened by `gap` so the rounded ends do not touch.
 */
export function donutSlices(values: number[], circumference: number, gap: number): DonutSlice[] {
  const clean = values.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const total = clean.reduce((a, b) => a + b, 0);
  const drawn = clean.filter((v) => v > 0).length;
  let start = 0;
  return clean.map((value) => {
    const fraction = total > 0 ? value / total : 0;
    const length = fraction * circumference;
    const useGap = drawn > 1 ? gap : 0;
    const slice: DonutSlice = {
      value,
      fraction,
      percent: Math.round(fraction * 100),
      dash: value > 0 ? Math.max(0.01, length - useGap) : 0,
      offset: start + useGap / 2,
    };
    start += length;
    return slice;
  });
}

/** A weight as the bin reports it: up to 3 decimals, trailing zeros dropped (0.076, 1.5, 0). */
export function formatKg(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  return String(Number(value.toFixed(3)));
}

/** A total weight for a profile: rounded to 2 decimals, trailing zeros dropped (0.17, 1.5, 2). */
export function formatKgTotal(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  return String(Number(value.toFixed(2)));
}
