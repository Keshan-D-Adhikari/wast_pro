import type { Href } from 'expo-router';

/**
 * The screen a notification should open when it is tapped, or null when there
 * is nothing to open (bin alerts are about the bin on the dashboard itself).
 */
// In: the notification type (like 'order_confirmed') and whether the user is a seller or buyer.
// Out: the route to open, or null for no navigation.
export function notificationRoute(type: string, role: 'seller' | 'buyer'): Href | null {
  if (type.startsWith('order_')) {
    return role === 'seller' ? '/(tabs)/seller/SellerOrders' : '/(tabs)/buyer/BuyerOrders';
  }
  if (type.startsWith('offer_')) {
    return role === 'seller' ? '/(tabs)/seller/SellerOffers' : '/(tabs)/buyer/BuyerOffers';
  }
  return null;
}
