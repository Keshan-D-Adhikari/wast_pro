import { sellerActionsFor, completingCollectsCash } from './orderActions';

describe('sellerActionsFor', () => {
  it('lets a seller confirm or decline a pending order', () => {
    expect(sellerActionsFor({ status: 'pending' })).toEqual(['confirm', 'decline']);
  });
  it('lets a seller complete a confirmed order', () => {
    expect(sellerActionsFor({ status: 'confirmed' })).toEqual(['complete']);
  });
  it('offers nothing once an order is completed or cancelled', () => {
    expect(sellerActionsFor({ status: 'completed' })).toEqual([]);
    expect(sellerActionsFor({ status: 'cancelled' })).toEqual([]);
  });
});

describe('completingCollectsCash', () => {
  it('is true only for an unpaid cash order', () => {
    expect(completingCollectsCash({ paymentMethod: 'cash', paymentStatus: 'pending' })).toBe(true);
    expect(completingCollectsCash({ paymentMethod: 'cash', paymentStatus: 'paid' })).toBe(false);
    expect(completingCollectsCash({ paymentMethod: 'card', paymentStatus: 'paid' })).toBe(false);
  });
});
