// The Ongoing / Completed / Cancelled tab strip at the top of the orders screens.
// Used by SellerOrders and BuyerOrders. The tab list and counts come from utils/orderTabs.ts.

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Palette, Space, Type } from '@/constants/design';
import { ORDER_TABS, OrderTab } from '../../utils/orderTabs';

// value = the selected tab, counts = number of orders per tab, onChange = called with the tapped tab.
type Props = {
  value: OrderTab;
  counts: Record<OrderTab, number>;
  onChange: (tab: OrderTab) => void;
};

// The screen owns the selected tab (a 'controlled' component): this one only draws and reports taps.
/** Ongoing / Completed / Cancelled tabs with an underline on the active one and a count on each. */
export function OrderTabs({ value, counts, onChange }: Props) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {ORDER_TABS.map((tab) => {
        // Is this the selected tab?
        const active = tab.key === value;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${tab.label}, ${counts[tab.key]} orders`}
          >
            <Text style={[Type.bodyStrong, styles.label, active && styles.labelActive]}>
              {tab.label} ({counts[tab.key]})
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// row = the strip with a grey line under it. tab = each tab; the active one gets a green underline.
const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Palette.ink[200], marginBottom: Space.lg },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Space.md, borderBottomWidth: 3, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive: { borderBottomColor: Palette.brand[600] },
  label: { color: Palette.ink[500], fontSize: 15 },
  labelActive: { color: Palette.ink[900] },
});
