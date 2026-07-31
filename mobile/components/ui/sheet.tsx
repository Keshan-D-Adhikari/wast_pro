import { ReactNode } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Space, Radius, Shadow, Type } from '@/constants/design';

type SheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Cap the body height and scroll — use for long lists like notifications. */
  scrollable?: boolean;
};

/**
 * Bottom sheet used for every modal in the app (reports, notifications,
 * checkout). Replaces the centred alert-style modals that each screen
 * used to style on its own.
 */
export function Sheet({ visible, title, onClose, children, scrollable = false }: SheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Tapping the dimmed area dismisses, matching platform expectations */}
        <TouchableOpacity style={styles.backdropTouch} onPress={onClose} activeOpacity={1} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + Space.xl }]}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <Text style={Type.h2}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={Palette.ink[500]} />
            </TouchableOpacity>
          </View>

          {scrollable ? (
            <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          ) : (
            children
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: Palette.overlay },
  backdropTouch: { flex: 1 },
  sheet: {
    backgroundColor: Palette.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Space.xl,
    paddingTop: Space.md,
    ...Shadow[3],
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: Palette.ink[200],
    alignSelf: 'center',
    marginBottom: Space.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Space.xl,
  },
  scrollBody: { maxHeight: 420 },
});
