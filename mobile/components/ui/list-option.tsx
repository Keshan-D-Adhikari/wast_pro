// Two small building blocks for profile screens:
// ListOption = a tappable settings row (icon, title, arrow). StatTile = a small number card.
// Used on SellerProfile and BuyerProfile.

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Space, Radius, Shadow, Type } from '@/constants/design';

// Props: icon, title, optional subtitle, onPress (what happens on tap),
// destructive = show in red, for actions like 'Log out'.
type ListOptionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  /** Render in danger colours, e.g. "Log out". */
  destructive?: boolean;
};

// The arrow only shows when onPress exists. Without onPress the row cannot be tapped.
/** Tappable settings row with a leading icon and chevron. */
export function ListOption({ icon, title, subtitle, onPress, destructive }: ListOptionProps) {
  // Pick the colour pair: red for destructive rows, green for normal rows.
  const tint = destructive ? Palette.status.danger : { base: Palette.brand[600], tint: Palette.brand[100] };

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <View style={[styles.icon, { backgroundColor: tint.tint }]}>
        <Ionicons name={icon} size={18} color={tint.base} />
      </View>
      <View style={styles.text}>
        <Text style={[Type.bodyStrong, destructive && { color: Palette.status.danger.base }]}>
          {title}
        </Text>
        {!!subtitle && <Text style={Type.caption}>{subtitle}</Text>}
      </View>
      {!!onPress && <Ionicons name="chevron-forward" size={18} color={Palette.ink[300]} />}
    </TouchableOpacity>
  );
}

// Props: value = the big text (e.g. '12 kg'), label = small text below, icon = optional icon,
// color = custom accent colours.
type StatTileProps = {
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Override the accent, e.g. for environmental impact tiles. */
  color?: { base: string; tint: string };
};

// numberOfLines and adjustsFontSizeToFit shrink long values to fit one line.
/** Compact metric tile used in the profile stat and impact grids. */
export function StatTile({ value, label, icon, color }: StatTileProps) {
  // Use the given colours or the default green.
  const c = color ?? { base: Palette.brand[600], tint: Palette.brand[100] };

  return (
    <View style={styles.tile}>
      {!!icon && (
        <View style={[styles.tileIcon, { backgroundColor: c.tint }]}>
          <Ionicons name={icon} size={19} color={c.base} />
        </View>
      )}
      <Text style={[styles.tileValue, { color: c.base }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.tileLabel} numberOfLines={2}>{label}</Text>
    </View>
  );
}

// row/icon/text = ListOption. tile/tileIcon/tileValue/tileLabel = StatTile.
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Space.md,
    marginBottom: Space.sm,
    ...Shadow[1],
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },

  tile: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Space.md,
    alignItems: 'center',
    gap: Space.xs,
    ...Shadow[1],
  },
  tileIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.xs,
  },
  tileValue: { fontSize: 22, fontWeight: '800', lineHeight: 27 },
  tileLabel: { ...Type.caption, textAlign: 'center', color: Palette.ink[500] },
});
