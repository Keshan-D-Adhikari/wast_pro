import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  value: number;
  /** When given, the stars are tappable and call this with 1-5. */
  onRate?: (rating: number) => void;
  size?: number;
};

const GOLD = '#E0A800';

/** Five stars, filled up to `value`. Read-only unless `onRate` is passed. */
export function StarRating({ value, onRate, size = 22 }: Props) {
  return (
    <View style={styles.row} accessibilityLabel={value ? `Rated ${value} out of 5` : 'Not rated yet'}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = (
          <Ionicons name={n <= value ? 'star' : 'star-outline'} size={size} color={GOLD} />
        );
        return onRate ? (
          <TouchableOpacity
            key={n}
            onPress={() => onRate(n)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${n} star${n > 1 ? 's' : ''}`}
          >
            {icon}
          </TouchableOpacity>
        ) : (
          <View key={n}>{icon}</View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 4 } });
