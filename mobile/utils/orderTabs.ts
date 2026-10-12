import type { Order } from '../types';

export type OrderTab = 'ongoing' | 'completed' | 'cancelled';

export const ORDER_TABS: readonly { key: OrderTab; label: string }[] = [
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

/** Which tab an order belongs to: waiting or confirmed orders are ongoing. */
export function tabForOrder(order: Pick<Order, 'status'>): OrderTab {
  if (order.status === 'completed') return 'completed';
  if (order.status === 'cancelled') return 'cancelled';
  return 'ongoing';
}

// In: a list of orders. Out: how many orders are in each tab, for the number badges.
// Example: { ongoing: 2, completed: 5, cancelled: 0 }.
export function countByTab(orders: Pick<Order, 'status'>[]): Record<OrderTab, number> {
  const counts: Record<OrderTab, number> = { ongoing: 0, completed: 0, cancelled: 0 };
  for (const o of orders) counts[tabForOrder(o)] += 1;
  return counts;
}
