// The floating tab bar at the bottom of the dashboard screens.
// Used by SellerDashboard, AddWaste, SellerOrders, SellerProfile and the buyer equivalents.

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Space, Radius, Shadow, Type, BOTTOM_NAV_HEIGHT } from '@/constants/design';

// The names of the tabs a screen can mark as active.
type TabKey = 'home' | 'market' | 'orders' | 'profile';

// One tab: its key, text, two icons (outline when idle, filled when active) and the screen to open.
type Tab = {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  route: Href;
};

// Sellers get four tabs. 'route' is the file path of the screen inside the app folder.
const SELLER_TABS: Tab[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home', route: '/(tabs)/seller/SellerDashboard' },
  { key: 'market', label: 'Market', icon: 'add-circle-outline', activeIcon: 'add-circle', route: '/(tabs)/seller/AddWaste' },
  { key: 'orders', label: 'Orders', icon: 'receipt-outline', activeIcon: 'receipt', route: '/(tabs)/seller/SellerOrders' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', route: '/(tabs)/seller/SellerProfile' },
];

// Buyers get three tabs.
const BUYER_TABS: Tab[] = [
  { key: 'home', label: 'Marketplace', icon: 'storefront-outline', activeIcon: 'storefront', route: '/(tabs)/buyer/BuyerDashboard' },
  { key: 'orders', label: 'Purchases', icon: 'cart-outline', activeIcon: 'cart', route: '/(tabs)/buyer/BuyerOrders' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', route: '/(tabs)/buyer/BuyerProfile' },
];

/**
 * Floating bottom navigation shared by both roles. Replaces the hand-rolled
 * bar that used to be copied into every dashboard screen.
 */
// Props: role picks which tab list to show, active says which tab is highlighted.
// The screen passes 'active' itself, for example <BottomNav role="seller" active="home" />.
export function BottomNav({ role, active }: { role: 'seller' | 'buyer'; active: TabKey }) {
  // router.push opens another screen. insets are the safe areas (home bar, notch) of the phone.
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabs = role === 'seller' ? SELLER_TABS : BUYER_TABS;

  return (
    // Fragment: lets us return two sibling views without an extra wrapper
    <>
      {/* Solid strip under the floating bar so scrolled content doesn't show through the gap around it */}
      <View
        pointerEvents="none"
        style={[styles.backdrop, { height: Space.lg + insets.bottom + BOTTOM_NAV_HEIGHT / 2 }]}
      />
      {/* Floating bar. pointerEvents box-none lets taps pass through the empty space around it */}
      <View style={[styles.wrap, { bottom: Space.lg + insets.bottom }]} pointerEvents="box-none">
        <View style={[styles.bar, { height: BOTTOM_NAV_HEIGHT }]}>
          {/* One touchable item per tab */}
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
                  // Tapping the tab we are already on does nothing.
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
    </>
  );
}

// Styles: backdrop (solid strip under the bar), wrap (position), bar (white rounded bar),
// item/iconWrap/label (each tab), and the Active versions for the selected tab.
const styles = StyleSheet.create({
  backdrop: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: Palette.background },
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
