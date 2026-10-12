// SELLER ORDERS SCREEN
// Who uses it: a seller. It is the "orders" tab of the seller bottom navigation.
// What it does: lists the orders buyers made on the seller's listings, in three tabs
// (ongoing, completed, cancelled). The seller can confirm, decline or complete an order.
// Order life: pending -> confirmed -> completed (or cancelled when declined).
// Data it uses:
//   - orders (read live where sellerUid == me; status / paymentStatus are updated)
//   - marketplace/{listingId} (put back to "available" when the seller declines)
//   - notifications (a message is written for the buyer after each action)
// Which buttons are visible is decided by utils/orderActions, and the tab an order belongs
// to by utils/orderTabs, so the rules live in one place and can be tested.
import { View, Text, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { db } from "../../../firebaseConfig";
import { useAuthUser } from "../../../hooks/useAuthUser";
import {
  collection, addDoc, query, where, orderBy, onSnapshot, doc, getDoc, updateDoc, writeBatch, deleteField, serverTimestamp,
} from "firebase/firestore";

import { Palette, Space, Radius, Type, wasteAccent } from "@/constants/design";
import { Screen, ScreenHeader } from "@/components/ui/screen";
import { Card, Divider, DetailRow } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, statusTone, statusLabel } from "@/components/ui/badge";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { BottomNav } from "@/components/ui/bottom-nav";
import { StarRating } from "@/components/ui/star-rating";
import { formatRs } from "../../../utils/money";
import { orderCode } from "../../../utils/shortId";
import { OrderTabs } from "@/components/ui/order-tabs";
import { OrderTab, tabForOrder, countByTab } from "../../../utils/orderTabs";
import { Order } from "../../../types";
import { sellerActionsFor, completingCollectsCash } from "../../../utils/orderActions";
import { buyerNotificationFor, SellerOrderEvent } from "../../../utils/orderNotifications";

// Text shown when a tab has no orders.
const EMPTY_TAB_TEXT: Record<OrderTab, string> = {
  ongoing: "No ongoing orders",
  completed: "No completed orders yet",
  cancelled: "No cancelled orders",
};

// Main component of the screen.
export default function SellerOrders() {
  // authUser is the logged in user (null while Firebase restores the login).
  const authUser = useAuthUser();
  const router = useRouter();
  // orders: every order of this seller. loading: show a spinner first.
  // tab: which tab is selected. useState keeps a value and redraws the screen when it changes.
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<OrderTab>("ongoing");

  // useEffect: when authUser is known, start a live listener on this seller's orders.
  useEffect(() => {
    if (!authUser) return;

    // Query: this seller's orders, newest first. Using where on one field and
    // orderBy on another needs a Firestore composite index.
    const q = query(
      collection(db, "orders"),
      where("sellerUid", "==", authUser.uid),
      orderBy("createdAt", "desc")
    );

    // onSnapshot is a LIVE listener. It runs now and again whenever an order changes,
    // so a new order or a status change shows up without refreshing.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersList);
      setLoading(false);
    // Error callback.
    }, (error) => {
      console.error("Error fetching seller orders:", error);
      setLoading(false);
    });

    // Cleanup: stop the listener when the screen closes so it does not keep running.
    return () => unsubscribe();
  }, [authUser]);

  // busyId is the id of the order being changed now. Its buttons show a spinner or are disabled.
  const [busyId, setBusyId] = useState<string | null>(null);

  // Helper that runs one action safely: mark the order as busy, run the work,
  // show an alert if it fails, and always clear the busy mark at the end.
  const run = async (order: Order, work: () => Promise<void>, failMessage: string) => {
    setBusyId(order.id);
    try {
      await work();
    } catch (error) {
      console.error(failMessage, error);
      Alert.alert('Error', failMessage);
    } finally {
      setBusyId(null);
    }
  };

  // Tell the buyer what happened. Best effort: a failed notification must not undo the order change.
  // Tell the buyer what happened. Best effort: a failed notification must not undo the order change.
  const notifyBuyer = async (order: Order, event: SellerOrderEvent) => {
    try {
      const { type, message } = buyerNotificationFor(event, order);
      await addDoc(collection(db, 'notifications'), {
        toUid: order.buyerUid,
        type,
        message,
        read: false,
        createdAt: serverTimestamp(),
        orderId: order.id,
      });
    } catch (error) {
      console.error('Could not notify buyer:', error);
    }
  };

  // Seller taps Confirm: set the order status to confirmed, then tell the buyer.
  const handleConfirm = (order: Order) =>
    run(order, async () => {
      await updateDoc(doc(db, 'orders', order.id), { status: 'confirmed' });
      await notifyBuyer(order, 'confirmed');
    }, 'Could not confirm this order.');

  // Seller taps Mark completed. For cash orders the seller must confirm the cash was received.
  const handleComplete = (order: Order) => {
    // True when this is a cash on delivery order that is not paid yet.
    const collectsCash = completingCollectsCash(order);
    Alert.alert(
      'Mark as completed?',
      collectsCash
        ? `Confirm you have received ${formatRs(order.totalPrice)} in cash and handed over the ${order.wasteType} waste.`
        : `Confirm the ${order.wasteType} waste has been handed over.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark completed',
          onPress: () =>
            run(order, async () => {
              // Cash on delivery: the cash is collected at hand-over, so record the payment first.
              // Cash on delivery: the cash is collected at hand-over, so record the payment first.
              if (collectsCash) await updateDoc(doc(db, 'orders', order.id), { paymentStatus: 'paid' });
              await updateDoc(doc(db, 'orders', order.id), { status: 'completed' });
              await notifyBuyer(order, 'completed');
            }, 'Could not complete this order.'),
        },
      ]
    );
  };

  // Seller taps Decline. The order is cancelled and the waste goes back on the marketplace.
  const handleDecline = (order: Order) => {
    Alert.alert(
      'Decline this order?',
      'The buyer will see it as cancelled and the listing goes back on the marketplace.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () =>
            run(order, async () => {
              // Cancel the order and relist the waste in one atomic batch. The listing is only
              // restored if this order is the one that bought it.
              // Cancel the order and relist the waste in one atomic batch. The listing is only
              // restored if this order is the one that bought it.
              // 1. Read the listing to check which order bought it.
              const listingRef = doc(db, 'marketplace', order.listingId);
              const listingSnap = await getDoc(listingRef);
              // 2. A writeBatch groups several writes and saves them together: all succeed or none do.
              // This way the order is never cancelled while the listing stays sold.
              const batch = writeBatch(db);
              batch.update(doc(db, 'orders', order.id), { status: 'cancelled', cancelledAt: serverTimestamp() });
              // 3. Only relist if this order is the one that bought the listing.
              // deleteField() removes the soldOrderId field.
              if (listingSnap.exists() && listingSnap.data().soldOrderId === order.id) {
                batch.update(listingRef, { status: 'available', soldOrderId: deleteField() });
              }
              // 4. Send all the writes at once, then tell the buyer.
              await batch.commit();
              await notifyBuyer(order, 'declined');
            }, 'Could not decline this order.'),
        },
      ]
    );
  };

  // Money earned so far: the sum of completed orders.
  const totalEarned = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  // One card for one order, with the buttons the seller is allowed to use.
  const OrderCard = ({ order }: { order: Order }) => {
    // Colour for this waste type.
    const accent = wasteAccent(order.wasteType);
    // createdAt is a Firestore timestamp. It can be missing just after saving.
    const date = order.createdAt?.toDate
      ? order.createdAt.toDate().toLocaleDateString()
      : "Just now";

    return (
      <Card style={styles.card}>
        {/* Header: waste icon, type and the status badge */}
        <View style={styles.cardHeader}>
          <View style={[styles.typeIcon, { backgroundColor: accent.tint }]}>
            <Ionicons name="leaf" size={17} color={accent.base} />
          </View>
          <Text style={[Type.bodyStrong, styles.typeText]} numberOfLines={1}>
            {order.wasteType} waste
          </Text>
          <Badge label={statusLabel(order.status)} tone={statusTone(order.status)} />
        </View>

        {/* Order details */}
        <Divider />

        <DetailRow label="Order ID" value={orderCode(order.id)} />
        <DetailRow label="Buyer" value={order.buyerName || '—'} />
        <DetailRow label="Weight" value={`${order.weightKg} kg`} />
        <DetailRow label="Date" value={date} />
        <DetailRow label="Total" value={formatRs(order.totalPrice)} emphasis />

        {/* How the buyer pays and whether it is paid */}
        <View style={styles.paymentRow}>
          <Badge
            label={order.paymentMethod === 'card' ? 'Paid by card' : 'Cash on delivery'}
            tone={order.paymentMethod === 'card' ? 'info' : 'warning'}
            icon={order.paymentMethod === 'card' ? 'card-outline' : 'cash-outline'}
          />
          {order.paymentStatus === 'paid' && <Badge label="Paid" tone="success" />}
        </View>

        {/* Rating the buyer gave, shown only for completed orders */}
        {order.status === 'completed' && (
          <View style={styles.ratingRow}>
            <Text style={Type.small}>Buyer rating</Text>
            <StarRating value={order.rating ?? 0} size={20} />
          </View>
        )}

        {/* Action buttons. Which ones show depends on the order status (see orderActions). */}
        {sellerActionsFor(order).length > 0 && (
          <View style={styles.actions}>
            {sellerActionsFor(order).includes('decline') && (
              <Button
                label="Decline"
                icon="close-circle-outline"
                variant="danger"
                onPress={() => handleDecline(order)}
                disabled={busyId === order.id}
                style={styles.actionFlex}
              />
            )}
            {sellerActionsFor(order).includes('confirm') && (
              <Button
                label="Confirm order"
                icon="checkmark-circle-outline"
                onPress={() => handleConfirm(order)}
                loading={busyId === order.id}
                style={styles.actionFlex}
              />
            )}
            {sellerActionsFor(order).includes('complete') && (
              <Button
                label="Mark completed"
                icon="checkmark-done-outline"
                onPress={() => handleComplete(order)}
                loading={busyId === order.id}
                style={styles.actionFlex}
              />
            )}
          </View>
        )}
      </Card>
    );
  };

  // Screen layout: header, summary, tabs and the list of orders.
  return (
    <View style={styles.root}>
      <Screen withBottomNav>
        {/* Page title, back button and a shortcut to the offers screen */}
        <ScreenHeader
          title="My orders"
          subtitle="Purchases buyers made from you"
          back
          right={
            <Button
              label="Offers"
              icon="pricetag-outline"
              variant="secondary"
              onPress={() => router.push("/(tabs)/seller/SellerOffers")}
              style={{ paddingHorizontal: Space.md }}
            />
          }
        />

        {/* Summary strip: number of orders and money earned */}
        {!loading && orders.length > 0 && (
          <Card tone="brand" elevation={0} style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={Type.caption}>TOTAL ORDERS</Text>
              <Text style={styles.summaryValue}>{orders.length}</Text>
            </View>
            <View style={styles.summaryRule} />
            <View style={styles.summaryItem}>
              <Text style={Type.caption}>EARNED (COMPLETED)</Text>
              <Text style={styles.summaryValue}>{formatRs(totalEarned)}</Text>
            </View>
          </Card>
        )}

        {/* Spinner, or the tabs with their list */}
        {loading ? (
          <LoadingState message="Loading your orders…" />
        ) : (
          <>
            {/* Ongoing / Completed / Cancelled tabs with counts */}
            <OrderTabs value={tab} counts={countByTab(orders)} onChange={setTab} />
            {orders.filter((o) => tabForOrder(o) === tab).length === 0 ? (
              <EmptyState
                icon="receipt-outline"
                title={EMPTY_TAB_TEXT[tab]}
                message={tab === "ongoing" ? "When a buyer purchases one of your listings it will show up here." : "Nothing here yet."}
                actionLabel={tab === "ongoing" ? "Add a listing" : undefined}
                onAction={() => router.push("/(tabs)/seller/AddWaste")}
              />
            ) : (
              orders
                .filter((o) => tabForOrder(o) === tab)
                .map((order) => <OrderCard key={order.id} order={order} />)
            )}
          </>
        )}
      </Screen>

      {/* Bottom tab bar */}
      <BottomNav role="seller" active="orders" />
    </View>
  );
}

// Styles: summary strip, order cards and action buttons.
/* ================= STYLES ================= */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.background },

  summaryCard: { flexDirection: 'row', alignItems: 'center', padding: Space.lg },
  summaryItem: { flex: 1, gap: Space.xs },
  summaryValue: { ...Type.h2, color: Palette.brand[900] },
  summaryRule: { width: 1, height: 34, backgroundColor: Palette.brand[200], marginHorizontal: Space.lg },

  ratingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: Space.md },
  card: { marginBottom: Space.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  typeIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: { flex: 1, textTransform: 'capitalize' },
  paymentRow: { marginTop: Space.sm, flexDirection: 'row', gap: Space.sm, flexWrap: 'wrap' },
  actions: { flexDirection: 'row', gap: Space.md, marginTop: Space.lg },
  actionFlex: { flex: 1 },
});
