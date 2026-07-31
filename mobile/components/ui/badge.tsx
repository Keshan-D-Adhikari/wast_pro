import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Space, Radius, Type, StatusTone } from '@/constants/design';

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

/** Capitalises a lowercase Firestore status for display. */
export const statusLabel = (status?: string) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';

type BadgeProps = {
  label: string;
  tone?: StatusTone;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Override colours for waste-type accents that aren't status tones. */
  color?: { base: string; tint: string };
};

/** Small rounded pill for statuses, payment methods and tags. */
export function Badge({ label, tone = 'neutral', icon, color }: BadgeProps) {
  const c = color ?? Palette.status[tone];

  return (
    <View style={[styles.badge, { backgroundColor: c.tint }]}>
      {!!icon && <Ionicons name={icon} size={12} color={c.base} />}
      <Text style={[styles.label, { color: c.base }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

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
  const c = Palette.status[tone];

  return (
    <View style={[styles.notice, { backgroundColor: c.tint, borderColor: c.base + '33' }]}>
      <Ionicons name={icon} size={18} color={c.base} />
      <Text style={[Type.small, styles.noticeText, { color: c.base }]}>{text}</Text>
    </View>
  );
}

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
