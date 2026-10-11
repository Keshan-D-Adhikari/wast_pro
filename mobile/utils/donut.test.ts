import { donutSlices, formatKg, formatKgTotal } from './donut';

describe('donutSlices', () => {
  it('gives every slice no arc when the total is zero', () => {
    const s = donutSlices([0, 0, 0], 100, 4);
    expect(s.every((x) => x.dash === 0 && x.percent === 0)).toBe(true);
  });

  it('splits by share and leaves a gap between slices', () => {
    const s = donutSlices([1, 3], 100, 4);
    expect(s[0].percent).toBe(25);
    expect(s[1].percent).toBe(75);
    expect(s[0].dash).toBeCloseTo(21);
    expect(s[1].offset).toBeCloseTo(27);
  });

  it('draws a single slice as a full ring with no gap', () => {
    const s = donutSlices([0, 5, 0], 100, 4);
    expect(s[1].dash).toBe(100);
    expect(s[1].offset).toBe(0);
  });

  it('ignores negative and non-finite values', () => {
    const s = donutSlices([-2, NaN, 2], 100, 4);
    expect(s[2].percent).toBe(100);
  });
});

describe('formatKg', () => {
  it('shows the real value instead of rounding to one decimal', () => {
    expect(formatKg(0.076)).toBe('0.076');
    expect(formatKg(1.5)).toBe('1.5');
    expect(formatKg(2)).toBe('2');
  });

  it('shows zero for empty, negative or invalid weights', () => {
    expect(formatKg(0)).toBe('0');
    expect(formatKg(-0.86)).toBe('0');
    expect(formatKg(NaN)).toBe('0');
  });
});

describe('formatKgTotal', () => {
  it('rounds a summed weight to 2 decimals and drops trailing zeros', () => {
    expect(formatKgTotal(0.16999999999999998)).toBe('0.17');
    expect(formatKgTotal(1.5)).toBe('1.5');
    expect(formatKgTotal(2)).toBe('2');
    expect(formatKgTotal(0.076 + 0.05)).toBe('0.13');
  });

  it('shows 0 for nothing or invalid', () => {
    expect(formatKgTotal(0)).toBe('0');
    expect(formatKgTotal(NaN)).toBe('0');
  });
});
