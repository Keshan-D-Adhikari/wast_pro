import { formatRs, roundMoney } from './money';

describe('money', () => {
  it('rounds float noise to two decimals', () => {
    expect(roundMoney(0.06 * 120)).toBe(7.2);
    expect(roundMoney(7.199999999999999)).toBe(7.2);
  });

  it('formats whole amounts without decimals and others with two', () => {
    expect(formatRs(120)).toBe('Rs 120');
    expect(formatRs(7.199999999999999)).toBe('Rs 7.20');
    expect(formatRs(2.25)).toBe('Rs 2.25');
  });

  it('treats missing or invalid amounts as zero', () => {
    expect(formatRs(undefined)).toBe('Rs 0');
    expect(formatRs(NaN)).toBe('Rs 0');
  });
});
