// A row of filter pills where only one is selected (for example waste type filters).
// Used on the buyer marketplace screen.

import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Palette, Space, Radius, Type } from '@/constants/design';

// One pill: a key used in code and a label shown to the user.
type ChipOption<T extends string> = { key: T; label: string };

// Props: options = the pills, value = the key that is selected, onChange = called with the new key.
type ChipGroupProps<T extends string> = {
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (key: T) => void;
};

// <T extends string> is a TypeScript generic: it lets the keys be any string type,
// such as 'all' | 'plastic', and keeps onChange typed to the same keys.
/** Horizontal row of rounded filter pills — one active at a time. */
export function ChipGroup<T extends string>({ options, value, onChange }: ChipGroupProps<T>) {
  return (
    // Horizontal scroll so many pills still fit on a small screen
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {/* One tappable pill per option; the active one gets the green style */}
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[Type.smallStrong, styles.label, active && styles.labelActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// row = spacing between pills, chip/chipActive = pill look, label/labelActive = text colour.
const styles = StyleSheet.create({
  row: { gap: Space.sm, paddingVertical: Space.xs },
  chip: {
    paddingHorizontal: Space.lg,
    paddingVertical: Space.sm,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surface,
    borderWidth: 1.5,
    borderColor: Palette.ink[200],
  },
  chipActive: {
    backgroundColor: Palette.brand[600],
    borderColor: Palette.brand[600],
  },
  label: { color: Palette.ink[500] },
  labelActive: { color: Palette.white },
});
