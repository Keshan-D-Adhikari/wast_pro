import { buyerNotificationFor } from './orderNotifications';

const order = { wasteType: 'plastic', weightKg: 2, sellerName: 'Nimal' };

describe('buyerNotificationFor', () => {
  it('maps each seller action to a notification type', () => {
    expect(buyerNotificationFor('confirmed', order).type).toBe('order_confirmed');
    expect(buyerNotificationFor('completed', order).type).toBe('order_completed');
    expect(buyerNotificationFor('declined', order).type).toBe('order_cancelled');
  });

  it('names the seller and the waste in the message', () => {
    expect(buyerNotificationFor('confirmed', order).message).toBe('Nimal confirmed your order for 2 kg of plastic waste.');
  });

  it('falls back when the seller name is missing', () => {
    expect(buyerNotificationFor('declined', { ...order, sellerName: '' }).message).toContain('The seller declined');
  });
});
