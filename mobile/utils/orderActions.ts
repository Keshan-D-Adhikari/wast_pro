import type { Order } from '../types';

/**
 * What a seller can do with an order, by its current state. These mirror the
 * transitions firestore.rules allows a seller to make on an order:
 *   pending   -> confirmed | cancelled (decline); an accepted offer stays pending until the buyer buys
 *   confirmed -> completed | cancelled
 * and marking a cash order paid when the cash is collected.
 */
export type SellerOrderAction = 'confirm' | 'decline' | 'complete';

// FUNCTION: sellerActionsFor - runs when a seller order card is drawn; decides which buttons to show: Confirm, Decline or Mark completed.
export function sellerActionsFor(order: Pick<Order, 'status' | 'awaitingBuyer'>): SellerOrderAction[] {
  switch (order.status) {
    case 'pending':
      // An accepted offer waits for the buyer to choose; until then the seller can only cancel.
      return order.awaitingBuyer ? ['decline'] : ['confirm', 'decline'];
    case 'confirmed':
      return ['complete'];
    default:
      return []; // completed or cancelled orders are final
  }
}

/** Completing a cash-on-delivery order is when the cash is collected, so it is also marked paid. */
// In: the order's payment info. Out: true if completing it should also mark it paid.
export function completingCollectsCash(order: Pick<Order, 'paymentMethod' | 'paymentStatus'>): boolean {
  return order.paymentMethod === 'cash' && order.paymentStatus === 'pending';
}
