import { ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Palette, Space, Radius, Shadow, Type, BOTTOM_NAV_HEIGHT } from '@/constants/design';

type ScreenProps = {
  children: ReactNode;
  /** Render inside a ScrollView (default) or a plain View. */
  scroll?: boolean;
  /** Leave room for a fixed bottom nav bar. */
  withBottomNav?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Page shell — applies the app background, safe-area top inset and the
 * standard horizontal gutter so screens don't each re-invent padding.
 */
export function Screen({ children, scroll = true, withBottomNav = false, contentStyle }: ScreenProps) {
  const insets = useSafeAreaInsets();

  const padding = {
    paddingTop: insets.top + Space.sm,
    paddingHorizontal: Space.xl,
    paddingBottom: (withBottomNav ? BOTTOM_NAV_HEIGHT : 0) + insets.bottom + Space['3xl'],
  };

  if (!scroll) {
    return <View style={[styles.root, padding, contentStyle]}>{children}</View>;
  }

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[padding, contentStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Show a circular back button to the left of the title. */
  back?: boolean;
  /** Optional element pinned to the right (e.g. a notification bell). */
  right?: ReactNode;
};

/** Consistent screen title block with optional back button and trailing slot. */
export function ScreenHeader({ title, subtitle, back = false, right }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
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
      <View style={styles.headerText}>
        <Text style={Type.h1} numberOfLines={2}>{title}</Text>
        {!!subtitle && <Text style={[Type.small, styles.subtitle]}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

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
