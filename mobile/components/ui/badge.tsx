// Small coloured labels. Badge is a pill (e.g. 'Pending'). Notice is a wider message strip.
// Used on order cards, listing cards and warning messages across the seller and buyer screens.

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Space, Radius, Type, StatusTone } from '@/constants/design';

// In: a status text like 'pending'. Out: a colour tone name. Unknown statuses are 'neutral' (grey).
/** Maps an order/listing status to a semantic colour tone. */
export const statusTone = (status?: string): StatusTone => {
  switch ((status || '').toLowerCase()) {
    case 'completed':
    case 'paid':
    case 'available':
      return 'success';
    case 'confirmed':
      return 'info';
    case 'pending':
      return 'warning';
    case 'cancelled':
      return 'danger';
    default:
      return 'neutral';
  }
};

// Example: 'pending' becomes 'Pending'. No status gives 'Unknown'.
/** Capitalises a lowercase Firestore status for display. */
export const statusLabel = (status?: string) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';

// Props (the inputs a screen passes in):
// label = the text, tone = colour family, icon = optional Ionicons icon name.
type BadgeProps = {
  label: string;
  tone?: StatusTone;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Override colours for waste-type accents that aren't status tones. */
  color?: { base: string; tint: string };
};

// Badge is a function component: it receives props and returns what to draw (JSX).
/** Small rounded pill for statuses, payment methods and tags. */
export function Badge({ label, tone = 'neutral', icon, color }: BadgeProps) {
  // Use the custom colour if given, otherwise the colour for the tone.
  const c = color ?? Palette.status[tone];

  return (
    // Pill background, optional icon, then the text
    <View style={[styles.badge, { backgroundColor: c.tint }]}>
      {!!icon && <Ionicons name={icon} size={12} color={c.base} />}
      <Text style={[styles.label, { color: c.base }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// Props: text = message, tone = colour family (default warning), icon = Ionicons name.
/** Coloured callout strip for warnings and info notices. */
export function Notice({
  text,
  tone = 'warning',
  icon = 'alert-circle-outline',
}: {
  text: string;
  tone?: StatusTone;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  // 'c.base + 33' adds a hex alpha, making the border a faded version of the base colour.
  const c = Palette.status[tone];

  return (
    <View style={[styles.notice, { backgroundColor: c.tint, borderColor: c.base + '33' }]}>
      <Ionicons name={icon} size={18} color={c.base} />
      <Text style={[Type.small, styles.noticeText, { color: c.base }]}>{text}</Text>
    </View>
  );
}

// Styles: the pill (badge/label) and the wide strip (notice/noticeText).
const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    paddingHorizontal: Space.md,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  label: { ...Type.caption, fontWeight: '700' },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    padding: Space.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Space.lg,
  },
  noticeText: { flex: 1, fontWeight: '500' },
});
