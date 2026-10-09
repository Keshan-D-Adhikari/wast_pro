import {
  normalizeBin, parseLevel, parseWeightKg, toEpochMs, describeFreshness, formatAge, STALE_AFTER_MS,
} from './binTelemetry';

describe('parseLevel', () => {
  it('maps the firmware level words and percentages', () => {
    expect(parseLevel('EMPTY')).toEqual({ level: 0, status: 'EMPTY' });
    expect(parseLevel('50%')).toEqual({ level: 50, status: 'HALF' });
    expect(parseLevel('75%')).toEqual({ level: 75, status: '75%' });
    expect(parseLevel('FULL')).toEqual({ level: 100, status: 'FULL' });
  });
  it('is tolerant of case, spaces and a missing percent sign', () => {
    expect(parseLevel(' full ')).toEqual({ level: 100, status: 'FULL' });
    expect(parseLevel('50')).toEqual({ level: 50, status: 'HALF' });
    expect(parseLevel('25%')).toEqual({ level: 25, status: 'LOW' });
  });
  it('treats ERROR, missing and unknown values as a sensor error, not a reading', () => {
    expect(parseLevel('ERROR')).toEqual({ level: 0, status: 'ERROR' });
    expect(parseLevel(undefined)).toEqual({ level: 0, status: 'ERROR' });
    expect(parseLevel('???')).toEqual({ level: 0, status: 'ERROR' });
  });
});

describe('parseWeightKg', () => {
  it('converts grams to kg', () => {
    expect(parseWeightKg(1500)).toBe(1.5);
    expect(parseWeightKg('250')).toBe(0.25);
  });
  it('clamps negative drift and bad values to zero', () => {
    expect(parseWeightKg(-0.03088)).toBe(0);
    expect(parseWeightKg(undefined)).toBe(0);
    expect(parseWeightKg('abc')).toBe(0);
  });
});

describe('normalizeBin', () => {
  it('converts the firmware shape into BinData', () => {
    const bin = normalizeBin({
      compartments: {
        plastic: { level: 'FULL', weight: 3400 },
        food: { level: '50%', weight: 1800 },
        metal: { level: 'EMPTY', weight: 12 },
      },
      lastUpdated: 1790695315669,
      location: 'Horizon Campus',
      owner: 'user001',
    });
    expect(bin?.plastic).toEqual({ level: 100, status: 'FULL', weight: 3.4 });
    expect(bin?.food).toEqual({ level: 50, status: 'HALF', weight: 1.8 });
    expect(bin?.metal).toEqual({ level: 0, status: 'EMPTY', weight: 0.012 });
    expect(bin?.lastUpdated).toBe(1790695315669);
    expect(bin?.location).toBe('Horizon Campus');
  });
  it('flags a failed sensor as ERROR and keeps the rest', () => {
    const bin = normalizeBin({ compartments: { plastic: { level: 'ERROR', weight: -0.03 }, food: { level: 'EMPTY', weight: 0 } } });
    expect(bin?.plastic.status).toBe('ERROR');
    expect(bin?.metal).toEqual({ level: 0, weight: 0 }); // missing compartment
  });
  it('returns null for no data', () => {
    expect(normalizeBin(null)).toBeNull();
    expect(normalizeBin('x')).toBeNull();
  });
});

describe('toEpochMs / freshness', () => {
  it('accepts seconds, milliseconds and date strings', () => {
    expect(toEpochMs(1790695315)).toBe(1790695315000);
    expect(toEpochMs(1790695315669)).toBe(1790695315669);
    expect(toEpochMs('2026-09-29T10:00:00Z')).toBe(Date.parse('2026-09-29T10:00:00Z'));
    expect(toEpochMs(undefined)).toBeNull();
  });
  it('is live within two minutes and offline after', () => {
    const now = 1_000_000_000_000;
    expect(describeFreshness(now - 5_000, now).live).toBe(true);
    expect(describeFreshness(now - STALE_AFTER_MS - 1, now).live).toBe(false);
    expect(describeFreshness(null, now).live).toBe(false);
  });
  it('formats ages', () => {
    expect(formatAge(2_000)).toBe('just now');
    expect(formatAge(30_000)).toBe('30s ago');
    expect(formatAge(5 * 60_000)).toBe('5 min ago');
    expect(formatAge(3 * 3_600_000)).toBe('3 h ago');
    expect(formatAge(11 * 86_400_000)).toBe('11 days ago');
  });
});
