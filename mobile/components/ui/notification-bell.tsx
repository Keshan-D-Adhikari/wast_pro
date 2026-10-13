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

// FUNCTION: NotificationBell - runs when a screen shows the bell icon; shows the unread count and the list of notifications.
export function NotificationBell({ role = 'buyer' }: { role?: 'seller' | 'buyer' }) {
  const user = useAuthUser();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  // Start listening to the user's notifications when we know who they are.
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'notifications'), where('toUid', '==', user.uid));
    // onSnapshot calls our function every time the data changes (live updates).
    // It returns an 'unsubscribe' function, and returning that from useEffect stops the listener on cleanup.
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
        list.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setItems(list);
      },
      (error) => console.error('Notifications error:', error)
    );
  }, [user]);

  // How many notifications the user has not seen yet.
  const unread = items.filter((n) => !n.read).length;

  // FUNCTION: openSheet - runs when the bell is pressed; opens the notifications list and marks them as read.
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
      {/* BUTTON: "Notifications" */}
      <TouchableOpacity
        style={styles.btn}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        onPress={openSheet}
      >
        <Ionicons name="notifications-outline" size={22} color={Palette.brand[700]} />
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Sheet visible={open} title="Notifications" onClose={() => setOpen(false)} scrollable>
        {items.length === 0 ? (
          <Text style={[Type.small, styles.empty]}>No notifications yet</Text>
        ) : (
          items.map((n) => {
            const bad = n.type === 'order_cancelled';
            const tone = bad ? Palette.status.danger : Palette.status.success;
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
