import type { Order } from '../types';

/**
 * What a seller can do with an order, by its current state. These mirror the
 * transitions firestore.rules allows a seller to make on an order:
 *   pending   -> confirmed | cancelled (decline)
 *   confirmed -> completed | cancelled
 * and marking a cash order paid when the cash is collected.
 */
export type SellerOrderAction = 'confirm' | 'decline' | 'complete';

export function sellerActionsFor(order: Pick<Order, 'status'>): SellerOrderAction[] {
  switch (order.status) {
    case 'pending':
      return ['confirm', 'decline'];
    case 'confirmed':
      return ['complete'];
    default:
      return []; // completed or cancelled orders are final
  }
}

/** Completing a cash-on-delivery order is when the cash is collected, so it is also marked paid. */
export function completingCollectsCash(order: Pick<Order, 'paymentMethod' | 'paymentStatus'>): boolean {
  return order.paymentMethod === 'cash' && order.paymentStatus === 'pending';
}
