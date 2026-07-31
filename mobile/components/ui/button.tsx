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

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

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

const tone: Record<Variant, { bg: string; fg: string; border?: string; shadow: boolean }> = {
  primary: { bg: Palette.brand[600], fg: Palette.white, shadow: true },
  secondary: { bg: Palette.brand[100], fg: Palette.brand[700], border: Palette.brand[200], shadow: false },
  danger: { bg: Palette.status.danger.tint, fg: Palette.status.danger.base, border: '#F0C4C2', shadow: false },
  ghost: { bg: 'transparent', fg: Palette.ink[500], shadow: false },
};

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
  const t = tone[variant];
  const isDisabled = disabled || loading;

  return (
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
  label: { ...Type.bodyStrong, fontWeight: '700' },
  disabled: { opacity: 0.45 },
});
