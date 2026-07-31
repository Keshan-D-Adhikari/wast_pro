import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet
} from 'react-native';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../../../firebaseConfig';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Order, UserLocation } from "../../../types";

import { Palette, Space, Radius, Shadow, Type, wasteAccent } from "@/constants/design";
import { Screen, ScreenHeader } from "@/components/ui/screen";
import { Card, SectionTitle, Divider, DetailRow } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, statusTone, statusLabel } from "@/components/ui/badge";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { BottomNav } from "@/components/ui/bottom-nav";

const calculateDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );
  return R * c;
};

export default function BuyerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderMapVisible, setOrderMapVisible] = useState(false);
  const [buyerLocation, setBuyerLocation] = useState<UserLocation | null>(null);
  const [sellerLocation, setSellerLocation] = useState<UserLocation | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [routeDistance, setRouteDistance] = useState<string | null>(null);

  // Load buyer orders in real time from Firestore
  // Filters by buyerUid and sorts newest first
  // onSnapshot updates list automatically
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "orders"),
      where("buyerUid", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Order))
        .filter(order => order.status !== 'cancelled')
        .sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
      setOrders(ordersList);
      setLoading(false);
    }, (error) => {
      console.log("Error fetching buyer orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCancelOrder = async (order: any) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure? This order will be removed.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {

              await deleteDoc(
                doc(db, 'orders', order.id)
              );

              // Restore listing to marketplace
              if (order.listingId) {
                await updateDoc(
                  doc(db, 'marketplace',
                    order.listingId), {
                  status: 'available'
                });
              }

              // Notify seller
              await addDoc(
                collection(db, 'notifications'), {
                toUid: order.sellerUid,
                type: 'order_cancelled',
                message: (order.buyerName || 'Buyer')
                  + ' cancelled the order for '
                  + order.wasteType + ' waste.',
                read: false,
                createdAt: serverTimestamp()
              });

              Alert.alert(
                'Removed',
                'Order removed from your purchases.'
              );

            } catch (error) {
              console.log('Cancel error:', error);
              Alert.alert(
                'Error',
                'Could not remove order.'
              );
            }
          }
        }
      ]
    );
  };

  // Opens map showing route to seller bin location
  // Gets buyer GPS location before opening modal
  const handleOrderMap = async (order: Order) => {
    try {
      // Older seeded orders were written without coordinates
      if (
        typeof order.location?.latitude !== 'number' ||
        typeof order.location?.longitude !== 'number'
      ) {
        Alert.alert('Location unavailable', 'This order has no pickup coordinates recorded.');
        return;
      }

      setSelectedOrder(order);

      const { status } = await
        Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow location access');
        return;
      }

      const pos = await
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });

      const buyer = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      };

      const seller = {
        latitude: order.location.latitude,
        longitude: order.location.longitude
      };

      setBuyerLocation(buyer);
      setSellerLocation(seller);

      const dist = calculateDistance(
        buyer.latitude, buyer.longitude,
        seller.latitude, seller.longitude
      );
      setRouteDistance(dist.toFixed(1));

      setOrderMapVisible(true);

    } catch (error) {
      console.log('Map error:', error);
      Alert.alert('Error', 'Could not open map');
    }
  };

  const totalSpent = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  const OrderCard = ({ order, isLatest }: { order: Order; isLatest: boolean }) => {
    const accent = wasteAccent(order.wasteType);

    return (
      <Card style={[styles.card, isLatest && styles.cardLatest]}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeIcon, { backgroundColor: accent.tint }]}>
            <Ionicons name="cube-outline" size={17} color={accent.base} />
          </View>
          <Text style={[Type.bodyStrong, styles.typeText]} numberOfLines={1}>
            {order.wasteType} waste
          </Text>
          <Badge label={statusLabel(order.status)} tone={statusTone(order.status)} />
        </View>

        <Divider />

        <DetailRow label="Seller" value={order.sellerName || '—'} />
        <DetailRow label="Weight" value={`${order.weightKg} kg`} />
        <DetailRow label="Amount" value={`Rs ${order.totalPrice}`} emphasis />

        <View style={styles.badgeRow}>
          {order.paymentMethod === 'cash' ? (
            <Badge label="Cash on delivery" tone="warning" icon="cash-outline" />
          ) : (
            <Badge
              label={order.paymentLast4 ? `Card •••• ${order.paymentLast4}` : 'Card'}
              tone="info"
              icon="card-outline"
            />
          )}
          {order.paymentStatus === 'paid' && <Badge label="Paid" tone="success" />}
        </View>

        <View style={styles.actions}>
          {order.status === 'pending' && (
            <Button
              label="Cancel"
              icon="close-circle-outline"
              variant="danger"
              onPress={() => handleCancelOrder(order)}
              style={styles.actionFlex}
            />
          )}
          <Button
            label="View location"
            icon="location-outline"
            variant="secondary"
            onPress={() => handleOrderMap(order)}
            style={styles.actionFlex}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.root}>
      <Screen withBottomNav>
        <ScreenHeader title="My purchases" subtitle="Orders you placed with sellers" back />

        {!loading && orders.length > 0 && (
          <Card tone="brand" elevation={0} style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={Type.caption}>ORDERS</Text>
              <Text style={styles.summaryValue}>{orders.length}</Text>
            </View>
            <View style={styles.summaryRule} />
            <View style={styles.summaryItem}>
              <Text style={Type.caption}>TOTAL VALUE</Text>
              <Text style={styles.summaryValue}>Rs {totalSpent.toFixed(0)}</Text>
            </View>
          </Card>
        )}

        {loading ? (
          <LoadingState message="Loading your purchases…" />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="cart-outline"
            title="No purchases yet"
            message="Browse the marketplace to buy recyclable waste from nearby sellers."
            actionLabel="Start shopping"
            onAction={() => router.push("/(tabs)/buyer/BuyerDashboard" as any)}
          />
        ) : (
          <>
            <SectionTitle meta={`${orders.length} active`}>Your orders</SectionTitle>
            {orders.map((order, index) => (
              <OrderCard key={order.id} order={order} isLatest={index === 0} />
            ))}
          </>
        )}
      </Screen>

      {/* Order Location Map Modal */}
      <Modal visible={orderMapVisible} animationType="slide">
        <SafeAreaView style={styles.mapRoot}>
          <View style={styles.mapHeader}>
            <View style={styles.flex}>
              <Text style={Type.h2}>Pickup location</Text>
              <Text style={Type.small}>
                {selectedOrder?.wasteType} waste · Rs {selectedOrder?.totalPrice}
              </Text>
              {!!routeDistance && (
                <Text style={styles.routeInfo}>{routeDistance} km · straight line</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setOrderMapVisible(false)}
              style={styles.closeBtn}
              hitSlop={8}
            >
              <Ionicons name="close" size={24} color={Palette.ink[700]} />
            </TouchableOpacity>
          </View>

          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.flex}
            initialRegion={buyerLocation && sellerLocation ? {
              latitude: (buyerLocation.latitude + sellerLocation.latitude) / 2,
              longitude: (buyerLocation.longitude + sellerLocation.longitude) / 2,
              latitudeDelta: Math.abs(buyerLocation.latitude - sellerLocation.latitude) * 2,
              longitudeDelta: Math.abs(buyerLocation.longitude - sellerLocation.longitude) * 2,
            } : undefined}
          >
            {buyerLocation && sellerLocation && (
              <>
                <Marker coordinate={buyerLocation} title="You">
                  <View style={styles.buyerDot} />
                </Marker>
                <Marker coordinate={sellerLocation} title="Seller Location">
                  <Ionicons name="location" size={38} color={Palette.brand[600]} />
                </Marker>

                <Polyline
                  coordinates={[buyerLocation, sellerLocation]}
                  strokeColor="#4285F4"
                  strokeWidth={4}
                  lineDashPattern={[10, 5]}
                />
              </>
            )}
          </MapView>

          <View style={styles.mapFooter}>
            <View
              style={[
                styles.statusBanner,
                { backgroundColor: Palette.status[statusTone(selectedOrder?.status)].tint },
              ]}
            >
              <Ionicons
                name={selectedOrder?.status === 'confirmed' ? "checkmark-circle" : "time"}
                size={18}
                color={Palette.status[statusTone(selectedOrder?.status)].base}
              />
              {selectedOrder && (
                <Text
                  style={[
                    Type.smallStrong,
                    { color: Palette.status[statusTone(selectedOrder.status)].base },
                  ]}
                >
                  Order status: {statusLabel(selectedOrder.status)}
                </Text>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <BottomNav role="buyer" active="orders" />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.background },
  flex: { flex: 1 },

  summaryCard: { flexDirection: 'row', alignItems: 'center', padding: Space.lg },
  summaryItem: { flex: 1, gap: Space.xs },
  summaryValue: { ...Type.h2, color: Palette.brand[900] },
  summaryRule: { width: 1, height: 34, backgroundColor: Palette.brand[200], marginHorizontal: Space.lg },

  card: { marginBottom: Space.md },
  cardLatest: { borderLeftWidth: 4, borderLeftColor: Palette.brand[600] },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  typeIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: { flex: 1, textTransform: 'capitalize' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm, marginTop: Space.sm },
  actions: { flexDirection: 'row', gap: Space.md, marginTop: Space.lg },
  actionFlex: { flex: 1 },

  // Map Modal
  mapRoot: { flex: 1, backgroundColor: Palette.surface },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    padding: Space.xl,
    borderBottomWidth: 1,
    borderBottomColor: Palette.ink[100],
  },
  routeInfo: { ...Type.caption, color: Palette.brand[600], fontWeight: '700', marginTop: 2 },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyerDot: {
    width: 20,
    height: 20,
    borderRadius: Radius.pill,
    backgroundColor: '#4285F4',
    borderWidth: 3,
    borderColor: Palette.white,
    ...Shadow[2],
  },
  mapFooter: {
    padding: Space.xl,
    backgroundColor: Palette.surface,
    borderTopWidth: 1,
    borderTopColor: Palette.ink[100],
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
    padding: Space.md,
    borderRadius: Radius.md,
  },
});
