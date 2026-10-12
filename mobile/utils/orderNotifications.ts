import type { Order } from '../types';

export type SellerOrderEvent = 'confirmed' | 'completed' | 'declined';

// FUNCTION: buyerNotificationFor
// Runs when: the seller acts on an order.
// What it does: makes the notification type and message for the buyer.
/** The notification a seller's action on an order sends to the buyer. */
// In: the event and some order details. Out: the notification type and message.
// Example message: 'Nimal confirmed your order for 2 kg of plastic waste.'
export function buyerNotificationFor(
  event: SellerOrderEvent,
  order: Pick<Order, 'wasteType' | 'weightKg' | 'sellerName'>
): { type: 'order_confirmed' | 'order_completed' | 'order_cancelled'; message: string } {
  const what = `${order.weightKg} kg of ${order.wasteType} waste`;
  const seller = order.sellerName || 'The seller';
  switch (event) {
    case 'confirmed':
      return { type: 'order_confirmed', message: `${seller} confirmed your order for ${what}.` };
    case 'completed':
      return { type: 'order_completed', message: `Your order for ${what} is completed. You can rate it now.` };
    case 'declined':
      return { type: 'order_cancelled', message: `${seller} declined your order for ${what}.` };
  }
}
