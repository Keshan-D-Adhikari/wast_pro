import type { Href } from 'expo-router';

// FUNCTION: notificationRoute - runs when a notification is tapped; gives the screen to open (Orders or Offers).
export function notificationRoute(type: string, role: 'seller' | 'buyer'): Href | null {
  if (type.startsWith('order_')) {
    return role === 'seller' ? '/(tabs)/seller/SellerOrders' : '/(tabs)/buyer/BuyerOrders';
  }
  if (type.startsWith('offer_')) {
    return role === 'seller' ? '/(tabs)/seller/SellerOffers' : '/(tabs)/buyer/BuyerOffers';
  }
  return null;
}
