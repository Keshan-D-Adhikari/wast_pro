import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Palette, Space, Type } from '@/constants/design';
import { ORDER_TABS, OrderTab } from '../../utils/orderTabs';

type Props = {
  value: OrderTab;
  counts: Record<OrderTab, number>;
  onChange: (tab: OrderTab) => void;
};

/** Ongoing / Completed / Cancelled tabs with an underline on the active one and a count on each. */
export function OrderTabs({ value, counts, onChange }: Props) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {ORDER_TABS.map((tab) => {
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

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Palette.ink[200], marginBottom: Space.lg },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Space.md, borderBottomWidth: 3, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive: { borderBottomColor: Palette.brand[600] },
  label: { color: Palette.ink[500], fontSize: 14 },
  labelActive: { color: Palette.ink[900] },
});
