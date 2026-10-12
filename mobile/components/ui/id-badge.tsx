import { View, Text, StyleSheet } from 'react-native';
import { Palette, Space, Radius, Type } from '@/constants/design';

// Props: label = text on the left (e.g. 'Your ID'), code = the ID itself.
// 'selectable' lets the user long-press the code and copy it.
/** A short ID the user can read out to support, e.g. "Your ID  USR-7K3F9A". The text can be selected and copied. */
export function IdBadge({ label, code }: { label: string; code: string }) {
  return (
    <View style={styles.pill} accessible accessibilityLabel={`${label} ${code}`}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.code} selectable>
        {code}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    alignSelf: 'center',
    marginTop: Space.sm,
    paddingHorizontal: Space.md,
    paddingVertical: Space.xs,
    borderRadius: Radius.pill,
    backgroundColor: Palette.ink[100],
  },
  label: { ...Type.caption, color: Palette.ink[500] },
  code: { ...Type.smallStrong, color: Palette.ink[900], letterSpacing: 0.5 },
});
