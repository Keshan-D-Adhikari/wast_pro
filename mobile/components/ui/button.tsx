// The one button used everywhere in the app (login, checkout, order actions...).
// Variants: primary (solid green), secondary (light green), danger (red tint), ghost (plain text).

import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Space, Radius, Shadow, Type } from '@/constants/design';

// The four looks a button can have.
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

// Props: label = text, onPress = function to run on tap, variant = look, icon = optional icon,
// loading = show a spinner, disabled = cannot tap, compact = small width, style = extra styles.
type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  /** Ionicons name rendered before the label. */
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  /** Shrink to fit its content instead of filling the row. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Colours for each variant: bg = background, fg = text/icon colour, border, and whether it has a shadow.
const tone: Record<Variant, { bg: string; fg: string; border?: string; shadow: boolean }> = {
  primary: { bg: Palette.brand[600], fg: Palette.white, shadow: true },
  secondary: { bg: Palette.brand[100], fg: Palette.brand[700], border: Palette.brand[200], shadow: false },
  danger: { bg: Palette.status.danger.tint, fg: Palette.status.danger.base, border: '#F0C4C2', shadow: false },
  ghost: { bg: 'transparent', fg: Palette.ink[500], shadow: false },
};

// A '?' after a prop name means it is optional. The '=' values are the defaults.
/** Single button component for every tappable action in the app. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  compact = false,
  style,
}: ButtonProps) {
  // t holds the colours for the chosen variant.
  const t = tone[variant];
  // A loading button must not be tapped again, so it counts as disabled too.
  const isDisabled = disabled || loading;

  return (
    // The tappable area. It fades a little when pressed. The style array is applied in order.
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        compact ? styles.compact : styles.full,
        { backgroundColor: t.bg },
        !!t.border && { borderWidth: 1, borderColor: t.border },
        t.shadow && Shadow[2],
        t.shadow && { shadowColor: Palette.brand[600] },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {/* Show a spinner while loading, otherwise the icon and label */}
      {loading ? (
        <ActivityIndicator color={t.fg} />
      ) : (
        <View style={styles.content}>
          {!!icon && <Ionicons name={icon} size={18} color={t.fg} />}
          <Text style={[styles.label, { color: t.fg }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// base = shared look, full = fills the row, compact = shrinks to fit, content = icon + text row.
const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { alignSelf: 'stretch', paddingHorizontal: Space.xl },
  compact: { height: 44, paddingHorizontal: Space.xl, alignSelf: 'flex-start' },
  content: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  label: { ...Type.bodyStrong, fontSize: 17, fontWeight: '700' },
  disabled: { opacity: 0.45 },
});
