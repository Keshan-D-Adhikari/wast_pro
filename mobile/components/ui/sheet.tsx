// A panel that slides up from the bottom of the screen over a dimmed background.
// Used for notifications, report forms and checkout, so all pop-ups look the same.

import { ReactNode, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Keyboard, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Space, Radius, Shadow, Type } from '@/constants/design';

// Props: visible = show or hide, title, onClose = called to close it, children = the content,
// scrollable = limit the height and scroll, avoidKeyboard = move above the keyboard for inputs.
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
// The parent screen owns 'visible' (usually a useState) and sets it false inside onClose.
export function Sheet({ visible, title, onClose, children, scrollable = false, avoidKeyboard = false }: SheetProps) {
  // Safe area sizes and the screen height, used to size the sheet.
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  // KeyboardAvoidingView measures its position while a Modal is still sliding in, so it can lift the
  // sheet by the wrong amount. Track the keyboard height directly instead and pad the bottom by it.
  // How tall the keyboard is right now (0 when closed).
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  // Listen for the keyboard opening and closing. iOS has early 'Will' events for smoother movement.
  useEffect(() => {
    if (!avoidKeyboard) return;
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    // Cleanup: stop listening when the sheet closes or the prop changes.
    return () => {
      show.remove();
      hide.remove();
      setKeyboardHeight(0);
    };
  }, [avoidKeyboard]);

  // True only if this sheet cares about the keyboard and it is open.
  const keyboardOpen = avoidKeyboard && keyboardHeight > 0;
  // With the keyboard up, the body may only use the space left above it (minus the sheet's own header).
  const bodyMaxHeight = keyboardOpen
    ? Math.min(420, windowHeight - keyboardHeight - insets.top - 120)
    : undefined;

  return (
    // Modal draws above everything else. 'slide' animates it up from the bottom.
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.backdrop, keyboardOpen && { paddingBottom: keyboardHeight }]}>
        {/* Tapping the dimmed area dismisses, matching platform expectations */}
        <TouchableOpacity style={styles.backdropTouch} onPress={onClose} activeOpacity={1} />

        {/* The white panel itself */}
        <View style={[styles.sheet, { paddingBottom: keyboardOpen ? Space.xl : insets.bottom + Space.xl }]}>
          {/* Small grey bar at the top that hints the sheet can be dismissed */}
          <View style={styles.grabber} />

          {/* Title on the left and a close (X) button on the right */}
          <View style={styles.header}>
            <Text style={Type.h2}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={Palette.ink[500]} />
            </TouchableOpacity>
          </View>

          {/* Body: scrollable list or plain children */}
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

// backdrop = dim overlay, backdropTouch = tap-to-close area, sheet = white panel with rounded top,
// grabber = top bar, header = title row, scrollBody = default max height for scrollable sheets.
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
