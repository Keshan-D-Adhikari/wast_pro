import { tabForOrder, countByTab } from './orderTabs';

describe('order tabs', () => {
  it('puts pending and confirmed orders under ongoing', () => {
    expect(tabForOrder({ status: 'pending' })).toBe('ongoing');
    expect(tabForOrder({ status: 'confirmed' })).toBe('ongoing');
  });

  it('puts completed and cancelled orders under their own tabs', () => {
    expect(tabForOrder({ status: 'completed' })).toBe('completed');
    expect(tabForOrder({ status: 'cancelled' })).toBe('cancelled');
  });

  it('counts orders per tab', () => {
    const counts = countByTab([{ status: 'pending' }, { status: 'confirmed' }, { status: 'completed' }]);
    expect(counts).toEqual({ ongoing: 2, completed: 1, cancelled: 0 });
  });
});
