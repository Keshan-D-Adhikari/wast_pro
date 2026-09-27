import { binStatusTone, binStatusLabel, isBinFull } from './bin-status';

describe('binStatusTone', () => {
  it('maps each firmware status to the expected tone', () => {
    expect(binStatusTone('EMPTY')).toBe('neutral');
    expect(binStatusTone('LOW')).toBe('info');
    expect(binStatusTone('HALF')).toBe('warning');
    expect(binStatusTone('75%')).toBe('warning');
    expect(binStatusTone('FULL')).toBe('danger');
    expect(binStatusTone('ERROR')).toBe('danger');
  });

  it('is case-insensitive', () => {
    expect(binStatusTone('full')).toBe('danger');
  });

  it('falls back to neutral for missing/unknown status', () => {
    expect(binStatusTone(undefined)).toBe('neutral');
    expect(binStatusTone('WEIRD')).toBe('neutral');
  });
});

describe('binStatusLabel', () => {
  it('title-cases a normal status', () => {
    expect(binStatusLabel('EMPTY')).toBe('Empty');
    expect(binStatusLabel('full')).toBe('Full');
  });

  it('special-cases 75%', () => {
    expect(binStatusLabel('75%')).toBe('75% full');
  });

  it('reports "No data" when missing', () => {
    expect(binStatusLabel(undefined)).toBe('No data');
  });
});

describe('isBinFull', () => {
  it('is true only for FULL, case-insensitively', () => {
    expect(isBinFull('FULL')).toBe(true);
    expect(isBinFull('full')).toBe(true);
    expect(isBinFull('HALF')).toBe(false);
    expect(isBinFull(undefined)).toBe(false);
  });
});
