import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Space, Radius, Shadow, Type, BOTTOM_NAV_HEIGHT } from '@/constants/design';

type TabKey = 'home' | 'market' | 'orders' | 'profile';

type Tab = {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  route: Href;
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
 * Floating bottom navigation shared by both roles. Replaces the hand-rolled
 * bar that used to be copied into every dashboard screen.
 */
export function BottomNav({ role, active }: { role: 'seller' | 'buyer'; active: TabKey }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabs = role === 'seller' ? SELLER_TABS : BUYER_TABS;

  return (
    <View style={[styles.wrap, { bottom: Space.lg + insets.bottom }]} pointerEvents="box-none">
      <View style={[styles.bar, { height: BOTTOM_NAV_HEIGHT }]}>
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
                if (!isActive) router.push(tab.route);
              }}
            >
              <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={20}
                  color={isActive ? Palette.white : Palette.ink[300]}
                />
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: Space.lg,
    right: Space.lg,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    paddingHorizontal: Space.sm,
    ...Shadow[3],
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: Space.sm },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: Palette.brand[600] },
  label: { ...Type.caption, color: Palette.ink[300], fontWeight: '600' },
  labelActive: { color: Palette.brand[600], fontWeight: '700' },
});
