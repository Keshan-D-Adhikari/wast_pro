import { userCode, orderCode } from './shortId';

describe('short ids', () => {
  it('builds a user code from the first 6 characters of the uid', () => {
    expect(userCode('JSErfAcDVJXtsBTtxMX0LbfWtQM2')).toBe('USR-JSERFA');
  });

  it('builds an order code from the order id', () => {
    expect(orderCode('a1b2c3d4e5f6')).toBe('ORD-A1B2C3');
  });

  it('gives the same code every time for the same id', () => {
    expect(userCode('abc123xyz')).toBe(userCode('abc123xyz'));
  });

  it('copes with a missing id', () => {
    expect(userCode(undefined)).toBe('USR-??????');
    expect(orderCode(null)).toBe('ORD-??????');
  });
});
