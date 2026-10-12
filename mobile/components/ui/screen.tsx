// Layout shell used by nearly every screen. Screen gives the page background, safe areas
// and side padding. ScreenHeader gives a title with an optional back button.

import { ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Palette, Space, Radius, Shadow, Type, BOTTOM_NAV_HEIGHT } from '@/constants/design';

// Props: children = the page content, scroll = scrollable or fixed, withBottomNav = leave room
// for the bottom tab bar, contentStyle = extra styles, keyboardAware = move up when the keyboard opens.
type ScreenProps = {
  children: ReactNode;
  /** Render inside a ScrollView (default) or a plain View. */
  scroll?: boolean;
  /** Leave room for a fixed bottom nav bar. */
  withBottomNav?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Keep a focused text input above the on-screen keyboard — use on a scrolling screen that has inputs. */
  keyboardAware?: boolean;
};

/**
 * Page shell — applies the app background, safe-area top inset and the
 * standard horizontal gutter so screens don't each re-invent padding.
 */
export function Screen({ children, scroll = true, withBottomNav = false, contentStyle, keyboardAware = false }: ScreenProps) {
  // 'insets' = the unsafe edges of the phone (status bar, notch, home bar).
  const insets = useSafeAreaInsets();

  // Padding for the page: below the status bar, side gutters, and space at the bottom
  // (extra room when the bottom nav bar is showing).
  const padding = {
    paddingTop: insets.top + Space.sm,
    paddingHorizontal: Space.xl,
    paddingBottom: (withBottomNav ? BOTTOM_NAV_HEIGHT + Space['2xl'] : 0) + insets.bottom + Space['3xl'],
  };

  // Fixed (non-scrolling) page.
  if (!scroll) {
    return <View style={[styles.root, padding, contentStyle]}>{children}</View>;
  }

  // Scrolling page. 'handled' lets buttons still work while the keyboard is open.
  const scrollView = (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[padding, contentStyle]}
      keyboardShouldPersistTaps="handled"
      // iOS: pads the scroll area by the keyboard height and scrolls the focused input into view.
      automaticallyAdjustKeyboardInsets={keyboardAware}
    >
      {children}
    </ScrollView>
  );

  // Android (edge-to-edge) does not resize the window for the keyboard, so shrink the view instead.
  if (keyboardAware && Platform.OS === 'android') {
    return (
      <KeyboardAvoidingView style={styles.root} behavior="padding">
        {scrollView}
      </KeyboardAvoidingView>
    );
  }

  return <View style={styles.root}>{scrollView}</View>;
}

// Props: title, optional subtitle, back = show the back button, right = any element on the right.
type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Show a circular back button to the left of the title. */
  back?: boolean;
  /** Optional element pinned to the right (e.g. a notification bell). */
  right?: ReactNode;
};

// router.back() goes to the previous screen.
/** Consistent screen title block with optional back button and trailing slot. */
export function ScreenHeader({ title, subtitle, back = false, right }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    // Row layout: [back button] [title and subtitle] [right element]
    <View style={styles.header}>
      {/* Round back button, only when back is true */}
      {back && (
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={Palette.ink[700]} />
        </TouchableOpacity>
      )}
      {/* Title (max 2 lines) and optional subtitle */}
      <View style={styles.headerText}>
        <Text style={Type.h1} numberOfLines={2}>{title}</Text>
        {!!subtitle && <Text style={[Type.small, styles.subtitle]}>{subtitle}</Text>}
      </View>
      {/* Slot for something like the notification bell */}
      {right}
    </View>
  );
}

// root = full-screen background, header/headerText/subtitle = title block, backBtn = round button.
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Space['2xl'],
    gap: Space.md,
  },
  headerText: { flex: 1 },
  subtitle: { marginTop: 2 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow[1],
  },
});
