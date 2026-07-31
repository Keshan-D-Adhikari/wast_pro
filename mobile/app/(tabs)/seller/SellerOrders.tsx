import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { db, auth } from "../../../firebaseConfig";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

import { Palette, Space, Radius, Type, wasteAccent } from "@/constants/design";
import { Screen, ScreenHeader } from "@/components/ui/screen";
import { Card, SectionTitle, Divider, DetailRow } from "@/components/ui/card";
import { Badge, statusTone, statusLabel } from "@/components/ui/badge";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { BottomNav } from "@/components/ui/bottom-nav";

export default function SellerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "orders"),
      where("sellerUid", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersList);
      setLoading(false);
    }, (error) => {
      console.log("Error fetching seller orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const totalEarned = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  const OrderCard = ({ order }: { order: any }) => {
    const accent = wasteAccent(order.wasteType);
    const date = order.createdAt?.toDate()
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
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.root}>
      <Screen withBottomNav>
        <ScreenHeader title="My orders" subtitle="Purchases buyers made from you" back />

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
            onAction={() => router.push("/(tabs)/seller/AddWaste" as any)}
          />
        ) : (
          <>
            <SectionTitle meta={`${orders.length} total`}>Recent transactions</SectionTitle>
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
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
  paymentRow: { marginTop: Space.sm },
});
