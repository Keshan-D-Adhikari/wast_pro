import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Space, Radius, Type } from '@/constants/design';
import { Button } from './button';

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Friendly placeholder for empty lists, with an optional call to action. */
export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={38} color={Palette.brand[500]} />
      </View>
      <Text style={[Type.h2, styles.title]}>{title}</Text>
      {!!message && <Text style={[Type.small, styles.message]}>{message}</Text>}
      {!!actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} compact style={styles.action} />
      )}
    </View>
  );
}

/** Centred spinner replacement shown while a screen's first data loads. */
export function LoadingState({ message }: { message?: string }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.iconCircle}>
        <Ionicons name="leaf-outline" size={38} color={Palette.brand[500]} />
      </View>
      <Text style={[Type.small, styles.message]}>{message || 'Loading…'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', paddingVertical: Space['4xl'], paddingHorizontal: Space.xl },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.lg,
  },
  title: { textAlign: 'center' },
  message: { textAlign: 'center', marginTop: Space.sm, maxWidth: 280 },
  action: { marginTop: Space.xl, alignSelf: 'center' },
});
