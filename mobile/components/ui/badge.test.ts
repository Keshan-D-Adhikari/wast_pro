import { statusTone, statusLabel } from './badge';

describe('statusTone', () => {
  it('maps known statuses to the expected tone', () => {
    expect(statusTone('completed')).toBe('success');
    expect(statusTone('available')).toBe('success');
    expect(statusTone('paid')).toBe('success');
    expect(statusTone('confirmed')).toBe('info');
    expect(statusTone('pending')).toBe('warning');
    expect(statusTone('cancelled')).toBe('danger');
  });

  it('is case-insensitive', () => {
    expect(statusTone('PENDING')).toBe('warning');
  });

  it('falls back to neutral for an unknown or missing status', () => {
    expect(statusTone('archived')).toBe('neutral');
    expect(statusTone(undefined)).toBe('neutral');
  });
});

describe('statusLabel', () => {
  it('capitalises the first letter', () => {
    expect(statusLabel('pending')).toBe('Pending');
  });

  it('falls back to "Unknown" when missing', () => {
    expect(statusLabel(undefined)).toBe('Unknown');
    expect(statusLabel('')).toBe('Unknown');
  });
});
