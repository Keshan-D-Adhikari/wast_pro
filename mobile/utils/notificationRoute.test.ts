import { notificationRoute } from './notificationRoute';

describe('notificationRoute', () => {
  it('opens the orders screen of the user\'s own role for order notifications', () => {
    expect(notificationRoute('order_placed', 'seller')).toBe('/(tabs)/seller/SellerOrders');
    expect(notificationRoute('order_confirmed', 'buyer')).toBe('/(tabs)/buyer/BuyerOrders');
    expect(notificationRoute('order_cancelled', 'buyer')).toBe('/(tabs)/buyer/BuyerOrders');
  });

  it('opens the offers screen for offer notifications', () => {
    expect(notificationRoute('offer_received', 'seller')).toBe('/(tabs)/seller/SellerOffers');
    expect(notificationRoute('offer_accepted', 'buyer')).toBe('/(tabs)/buyer/BuyerOffers');
  });

  it('opens nothing for bin alerts or unknown types', () => {
    expect(notificationRoute('bin_full', 'seller')).toBeNull();
    expect(notificationRoute('something_else', 'buyer')).toBeNull();
  });
});
