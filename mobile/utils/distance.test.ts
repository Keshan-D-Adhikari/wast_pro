import { calculateDistance } from './distance';

describe('calculateDistance', () => {
  it('returns 0 for identical points', () => {
    expect(calculateDistance(6.9271, 79.8612, 6.9271, 79.8612)).toBe(0);
  });

  it('matches the known distance between Colombo and Kandy (~90-95km straight line)', () => {
    const km = calculateDistance(6.9271, 79.8612, 7.2906, 80.6337);
    expect(km).toBeGreaterThan(85);
    expect(km).toBeLessThan(100);
  });

  it('is symmetric regardless of point order', () => {
    const a = calculateDistance(6.9271, 79.8612, 7.2906, 80.6337);
    const b = calculateDistance(7.2906, 80.6337, 6.9271, 79.8612);
    expect(a).toBeCloseTo(b, 10);
  });
});
