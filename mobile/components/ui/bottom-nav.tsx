import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Space, Type, BOTTOM_NAV_HEIGHT } from '@/constants/design';

type TabKey = 'home' | 'market' | 'orders' | 'profile';

type Tab = {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const SELLER_TABS: Tab[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home', route: '/(tabs)/seller/SellerDashboard' },
  { key: 'market', label: 'Market', icon: 'add-circle-outline', activeIcon: 'add-circle', route: '/(tabs)/seller/AddWaste' },
  { key: 'orders', label: 'Orders', icon: 'receipt-outline', activeIcon: 'receipt', route: '/(tabs)/seller/SellerOrders' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', route: '/(tabs)/seller/SellerProfile' },
];

const BUYER_TABS: Tab[] = [
  { key: 'home', label: 'Browse', icon: 'search-outline', activeIcon: 'search', route: '/(tabs)/buyer/BuyerDashboard' },
  { key: 'orders', label: 'Purchases', icon: 'cart-outline', activeIcon: 'cart', route: '/(tabs)/buyer/BuyerOrders' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', route: '/(tabs)/buyer/BuyerProfile' },
];

/**
 * Fixed bottom navigation shared by both roles. Replaces the hand-rolled bar
 * that used to be copied into every dashboard screen.
 */
export function BottomNav({ role, active }: { role: 'seller' | 'buyer'; active: TabKey }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabs = role === 'seller' ? SELLER_TABS : BUYER_TABS;

  return (
    <View style={[styles.bar, { height: BOTTOM_NAV_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.item}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            onPress={() => {
              if (!isActive) router.push(tab.route as any);
            }}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={23}
              color={isActive ? Palette.brand[600] : Palette.ink[300]}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderTopWidth: 1,
    borderTopColor: Palette.ink[100],
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingTop: Space.sm },
  label: { ...Type.caption, color: Palette.ink[300], fontWeight: '600' },
  labelActive: { color: Palette.brand[600], fontWeight: '700' },
});
