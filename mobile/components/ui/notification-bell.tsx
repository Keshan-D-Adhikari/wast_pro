// The bell icon in screen headers. It shows an unread count and opens a list of notifications.
// Data comes live from the Firestore 'notifications' collection (messages for the signed-in user).
// Used on the seller and buyer dashboards.

import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuthUser } from '../../hooks/useAuthUser';
import { Palette, Space, Radius, Shadow, Type } from '@/constants/design';
import { Sheet } from '@/components/ui/sheet';
import { AppNotification } from '../../types';
import { notificationRoute } from '../../utils/notificationRoute';

// Prop: role says if the user is a seller or buyer, so a tap opens the right orders/offers screen.
/** Bell button with an unread badge; opens the signed-in user's notifications in a sheet. */
export function NotificationBell({ role = 'buyer' }: { role?: 'seller' | 'buyer' }) {
  // The signed-in user (or null while loading).
  const user = useAuthUser();
  const router = useRouter();
  // State: items = the user's notifications, open = whether the sheet is showing.
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  // Start listening to the user's notifications when we know who they are.
  useEffect(() => {
    if (!user) return;
    // Only notifications addressed to this user.
    const q = query(collection(db, 'notifications'), where('toUid', '==', user.uid));
    // onSnapshot calls our function every time the data changes (live updates).
    // It returns an 'unsubscribe' function, and returning that from useEffect stops the listener on cleanup.
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
        // Newest first. A missing time counts as 0 (oldest).
        list.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setItems(list);
      },
      (error) => console.error('Notifications error:', error)
    );
  }, [user]);

  // How many notifications the user has not seen yet.
  const unread = items.filter((n) => !n.read).length;

  // Opens the sheet and marks every unread notification as read in Firestore.
  const openSheet = async () => {
    setOpen(true);
    try {
      for (const n of items.filter((i) => !i.read)) {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      }
    } catch (error) {
      console.error('Error marking read:', error);
    }
  };

  return (
    <>
      {/* The bell button. hitSlop makes the tap area a bit bigger than the icon */}
      <TouchableOpacity
        style={styles.btn}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        onPress={openSheet}
      >
        <Ionicons name="notifications-outline" size={22} color={Palette.brand[700]} />
        {/* Red count badge, shown as '9+' when there are more than 9 */}
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Bottom sheet with the list of notifications */}
      <Sheet visible={open} title="Notifications" onClose={() => setOpen(false)} scrollable>
        {items.length === 0 ? (
          <Text style={[Type.small, styles.empty]}>No notifications yet</Text>
        ) : (
          items.map((n) => {
            // Cancelled orders are shown in red, everything else in green.
            const bad = n.type === 'order_cancelled';
            const tone = bad ? Palette.status.danger : Palette.status.success;
            // Where to go on tap. If null, the item is not tappable. Each item shows an icon,
            // the message, the time, and a small dot if it is unread.
            const route = notificationRoute(n.type, role);
            return (
              <TouchableOpacity
                key={n.id}
                style={styles.item}
                activeOpacity={route ? 0.6 : 1}
                disabled={!route}
                accessibilityRole={route ? 'button' : undefined}
                onPress={() => {
                  if (!route) return;
                  setOpen(false);
                  router.push(route);
                }}
              >
                <View style={[styles.icon, { backgroundColor: tone.tint }]}>
                  <Ionicons name={bad ? 'alert-circle' : 'notifications'} size={16} color={tone.base} />
                </View>
                <View style={styles.body}>
                  <Text style={Type.small}>{n.message}</Text>
                  <Text style={styles.time}>
                    {n.createdAt?.toDate() ? n.createdAt.toDate().toLocaleString() : 'Just now'}
                  </Text>
                </View>
                {!n.read && <View style={styles.dot} />}
              </TouchableOpacity>
            );
          })
        )}
      </Sheet>
    </>
  );
}

// btn/badge/badgeText = the bell and its count, the rest = items inside the sheet.
const styles = StyleSheet.create({
  btn: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow[1],
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: Radius.pill,
    backgroundColor: Palette.status.danger.base,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.surface,
  },
  badgeText: { color: Palette.white, fontSize: 9, fontWeight: '800' },
  empty: { textAlign: 'center', paddingVertical: Space['2xl'] },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.md, paddingVertical: Space.md },
  icon: { width: 32, height: 32, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  time: { ...Type.caption, color: Palette.ink[300], marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Palette.brand[600], marginTop: 6 },
});
