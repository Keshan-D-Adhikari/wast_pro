import { ReactNode, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Keyboard, Platform, useWindowDimensions } from 'react-native';
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
  /** Lift the sheet above the on-screen keyboard — use when the sheet contains a text input. */
  avoidKeyboard?: boolean;
};

/**
 * Bottom sheet used for every modal in the app (reports, notifications,
 * checkout). Replaces the centred alert-style modals that each screen
 * used to style on its own.
 */
export function Sheet({ visible, title, onClose, children, scrollable = false, avoidKeyboard = false }: SheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  // KeyboardAvoidingView measures its position while a Modal is still sliding in, so it can lift the
  // sheet by the wrong amount. Track the keyboard height directly instead and pad the bottom by it.
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    if (!avoidKeyboard) return;
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
      setKeyboardHeight(0);
    };
  }, [avoidKeyboard]);

  const keyboardOpen = avoidKeyboard && keyboardHeight > 0;
  // With the keyboard up, the body may only use the space left above it (minus the sheet's own header).
  const bodyMaxHeight = keyboardOpen
    ? Math.min(420, windowHeight - keyboardHeight - insets.top - 120)
    : undefined;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.backdrop, keyboardOpen && { paddingBottom: keyboardHeight }]}>
        {/* Tapping the dimmed area dismisses, matching platform expectations */}
        <TouchableOpacity style={styles.backdropTouch} onPress={onClose} activeOpacity={1} />

        <View style={[styles.sheet, { paddingBottom: keyboardOpen ? Space.xl : insets.bottom + Space.xl }]}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <Text style={Type.h2}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={Palette.ink[500]} />
            </TouchableOpacity>
          </View>

          {scrollable ? (
            <ScrollView
              style={[styles.scrollBody, bodyMaxHeight !== undefined && { maxHeight: bodyMaxHeight }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps={avoidKeyboard ? 'handled' : undefined}
            >
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
