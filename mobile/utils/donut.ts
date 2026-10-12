export type DonutSlice = { value: number; fraction: number; percent: number; dash: number; offset: number };

/**
 * Splits a ring of the given circumference into one slice per value.
 * Empty (zero) slices get no arc. When more than one slice is drawn, each is
 * shortened by `gap` so the rounded ends do not touch.
 */
// In: the values, the circle length (2 * PI * radius) and the small gap between slices.
// Out: one DonutSlice per value, in the same order.
// Example: values [1, 3] and circumference 100 give arcs of about 25 and 75 long.
export function donutSlices(values: number[], circumference: number, gap: number): DonutSlice[] {
  // Replace bad or negative numbers with 0.
  const clean = values.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  // Sum of all values, used to work out each share.
  const total = clean.reduce((a, b) => a + b, 0);
  // How many slices will really be visible (non-zero).
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
// Example: 0.07600001 becomes '0.076', 1.5 becomes '1.5'.
export function formatKg(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  return String(Number(value.toFixed(3)));
}

/** A total weight for a profile: rounded to 2 decimals, trailing zeros dropped (0.17, 1.5, 2). */
// Example: 0.1699999 becomes '0.17'.
export function formatKgTotal(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  return String(Number(value.toFixed(2)));
}
