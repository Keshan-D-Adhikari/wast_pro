import { View, Text, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { db } from "../../../firebaseConfig";
import { useAuthUser } from "../../../hooks/useAuthUser";
import {
  collection, query, where, orderBy, onSnapshot, doc, getDoc, updateDoc, writeBatch, deleteField, serverTimestamp,
} from "firebase/firestore";

import { Palette, Space, Radius, Type, wasteAccent } from "@/constants/design";
import { Screen, ScreenHeader } from "@/components/ui/screen";
import { Card, Divider, DetailRow } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, statusTone, statusLabel } from "@/components/ui/badge";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { BottomNav } from "@/components/ui/bottom-nav";
import { OrderTabs } from "@/components/ui/order-tabs";
import { OrderTab, tabForOrder, countByTab } from "../../../utils/orderTabs";
import { Order } from "../../../types";
import { sellerActionsFor, completingCollectsCash } from "../../../utils/orderActions";

const EMPTY_TAB_TEXT: Record<OrderTab, string> = {
  ongoing: "No ongoing orders",
  completed: "No completed orders yet",
  cancelled: "No cancelled orders",
};

export default function SellerOrders() {
  const authUser = useAuthUser();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<OrderTab>("ongoing");

  useEffect(() => {
    if (!authUser) return;

    const q = query(
      collection(db, "orders"),
      where("sellerUid", "==", authUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching seller orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authUser]);

  const [busyId, setBusyId] = useState<string | null>(null);

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

  const handleConfirm = (order: Order) =>
    run(order, () => updateDoc(doc(db, 'orders', order.id), { status: 'confirmed' }), 'Could not confirm this order.');

  const handleComplete = (order: Order) => {
    const collectsCash = completingCollectsCash(order);
    Alert.alert(
      'Mark as completed?',
      collectsCash
        ? `Confirm you have received Rs ${order.totalPrice} in cash and handed over the ${order.wasteType} waste.`
        : `Confirm the ${order.wasteType} waste has been handed over.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark completed',
          onPress: () =>
            run(order, async () => {
              // Cash on delivery: the cash is collected at hand-over, so record the payment first.
              if (collectsCash) await updateDoc(doc(db, 'orders', order.id), { paymentStatus: 'paid' });
              await updateDoc(doc(db, 'orders', order.id), { status: 'completed' });
            }, 'Could not complete this order.'),
        },
      ]
    );
  };

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
              const listingRef = doc(db, 'marketplace', order.listingId);
              const listingSnap = await getDoc(listingRef);
              const batch = writeBatch(db);
              batch.update(doc(db, 'orders', order.id), { status: 'cancelled', cancelledAt: serverTimestamp() });
              if (listingSnap.exists() && listingSnap.data().soldOrderId === order.id) {
                batch.update(listingRef, { status: 'available', soldOrderId: deleteField() });
              }
              await batch.commit();
            }, 'Could not decline this order.'),
        },
      ]
    );
  };

  const totalEarned = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  const OrderCard = ({ order }: { order: Order }) => {
    const accent = wasteAccent(order.wasteType);
    const date = order.createdAt?.toDate
      ? order.createdAt.toDate().toLocaleDateString()
      : "Just now";

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeIcon, { backgroundColor: accent.tint }]}>
            <Ionicons name="leaf" size={17} color={accent.base} />
          </View>
          <Text style={[Type.bodyStrong, styles.typeText]} numberOfLines={1}>
            {order.wasteType} waste
          </Text>
          <Badge label={statusLabel(order.status)} tone={statusTone(order.status)} />
        </View>

        <Divider />

        <DetailRow label="Buyer" value={order.buyerName || '—'} />
        <DetailRow label="Weight" value={`${order.weightKg} kg`} />
        <DetailRow label="Date" value={date} />
        <DetailRow label="Total" value={`Rs ${order.totalPrice}`} emphasis />

        <View style={styles.paymentRow}>
          <Badge
            label={order.paymentMethod === 'card' ? 'Paid by card' : 'Cash on delivery'}
            tone={order.paymentMethod === 'card' ? 'info' : 'warning'}
            icon={order.paymentMethod === 'card' ? 'card-outline' : 'cash-outline'}
          />
          {order.paymentStatus === 'paid' && <Badge label="Paid" tone="success" />}
        </View>

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

  return (
    <View style={styles.root}>
      <Screen withBottomNav>
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

        {!loading && orders.length > 0 && (
          <Card tone="brand" elevation={0} style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={Type.caption}>TOTAL ORDERS</Text>
              <Text style={styles.summaryValue}>{orders.length}</Text>
            </View>
            <View style={styles.summaryRule} />
            <View style={styles.summaryItem}>
              <Text style={Type.caption}>EARNED (COMPLETED)</Text>
              <Text style={styles.summaryValue}>Rs {totalEarned.toFixed(0)}</Text>
            </View>
          </Card>
        )}

        {loading ? (
          <LoadingState message="Loading your orders…" />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No orders yet"
            message="When a buyer purchases one of your listings it will show up here."
            actionLabel="Add a listing"
            onAction={() => router.push("/(tabs)/seller/AddWaste")}
          />
        ) : (
          <>
            <OrderTabs value={tab} counts={countByTab(orders)} onChange={setTab} />
            {orders.filter((o) => tabForOrder(o) === tab).length === 0 ? (
              <Text style={styles.emptyTab}>{EMPTY_TAB_TEXT[tab]}</Text>
            ) : (
              orders
                .filter((o) => tabForOrder(o) === tab)
                .map((order) => <OrderCard key={order.id} order={order} />)
            )}
          </>
        )}
      </Screen>

      <BottomNav role="seller" active="orders" />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.background },

  summaryCard: { flexDirection: 'row', alignItems: 'center', padding: Space.lg },
  summaryItem: { flex: 1, gap: Space.xs },
  summaryValue: { ...Type.h2, color: Palette.brand[900] },
  summaryRule: { width: 1, height: 34, backgroundColor: Palette.brand[200], marginHorizontal: Space.lg },

  emptyTab: { ...Type.body, color: Palette.ink[500], textAlign: "center", paddingVertical: Space.xl },
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
