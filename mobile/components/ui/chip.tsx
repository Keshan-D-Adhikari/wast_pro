import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Palette, Space, Radius, Type } from '@/constants/design';

type ChipOption<T extends string> = { key: T; label: string };

type ChipGroupProps<T extends string> = {
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (key: T) => void;
};

/** Horizontal row of rounded filter pills — one active at a time. */
export function ChipGroup<T extends string>({ options, value, onChange }: ChipGroupProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
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
