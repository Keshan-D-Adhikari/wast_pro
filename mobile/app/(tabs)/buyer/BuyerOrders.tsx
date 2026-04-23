import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  ActivityIndicator,
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
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../../../firebaseConfig';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Order, UserLocation } from "../../../types";

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
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (orders.length > 0) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [orders]);

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

  const handleCancelOrder = async (order: Order) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure? The listing will return to marketplace.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            await updateDoc(
              doc(db, 'orders', order.id), {
              status: 'cancelled',
              cancelledAt: serverTimestamp()
            });
            await updateDoc(
              doc(db, 'marketplace', order.listingId), {
              status: 'available'
            });
            await addDoc(
              collection(db, 'notifications'), {
              toUid: order.sellerUid,
              type: 'order_cancelled',
              message: order.buyerName +
                ' cancelled the order for ' +
                order.wasteType + ' waste.',
              read: false,
              createdAt: serverTimestamp()
            });
            Alert.alert('Cancelled',
              'Order cancelled. Listing is back on marketplace.');
          }
        }
      ]
    );
  };

  const handleOrderMap = async (order: Order) => {
    try {
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

  const OrderCard = ({ order, index }: { order: Order, index: number }) => {
    return (
      <View style={{
        backgroundColor: 'white', borderRadius: 12,
        padding: 16, marginBottom: 12,
        elevation: 2,
        borderLeftWidth: index === 0 ? 4 : 0,
        borderLeftColor: '#4F772D',
      }}>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}>
          <Text style={{ fontSize: 16, fontWeight: '700' }}>
            {order.wasteType} Waste
          </Text>
          <View style={[
            styles.statusBadge,
            order.status === 'pending' && { backgroundColor: '#FFF3E0' },
            order.status === 'confirmed' && { backgroundColor: '#E3F2FD' },
            order.status === 'completed' && { backgroundColor: '#E8F5E9' },
            order.status === 'cancelled' && { backgroundColor: '#FFEBEE' }
          ]}>
            <Text style={{
              fontSize: 12, fontWeight: '700',
              color: order.status === 'pending' ? '#E65100' :
                order.status === 'confirmed' ? '#1565C0' :
                  order.status === 'completed' ? '#2E7D32' : '#C62828'
            }}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={{ marginVertical: 10 }}>
          <Text>Seller: {order.sellerName}</Text>
          <Text>Weight: {order.weightKg} kg</Text>
          <Text>Amount: Rs {order.totalPrice}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 15 }}>
          {order.paymentMethod === 'cash' ? (
            <View style={[styles.miniBadge, { backgroundColor: '#FFF3E0' }]}>
              <Text style={{ color: '#E65100', fontSize: 10, fontWeight: '700' }}>Cash on Delivery</Text>
            </View>
          ) : (
            <View style={[styles.miniBadge, { backgroundColor: '#E3F2FD' }]}>
              <Text style={{ color: '#1565C0', fontSize: 10, fontWeight: '700' }}>Card •••• {order.paymentLast4}</Text>
            </View>
          )}

          {order.paymentStatus === 'paid' ? (
            <View style={[styles.miniBadge, { backgroundColor: '#E8F5E9' }]}>
              <Text style={{ color: '#2E7D32', fontSize: 10, fontWeight: '700' }}>Paid</Text>
            </View>
          ) : order.paymentMethod === 'cash' && (
            <View style={[styles.miniBadge, { backgroundColor: '#FFFDE7' }]}>
              <Text style={{ color: '#FBC02D', fontSize: 10, fontWeight: '700' }}>Pay on delivery</Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {order.status === 'pending' && (
            <TouchableOpacity
              onPress={() => handleCancelOrder(order)}
              style={{
                flex: 1, padding: 10, borderRadius: 8,
                backgroundColor: '#FFEBEE',
                borderWidth: 1, borderColor: '#EF9A9A',
                alignItems: 'center', marginRight: 6
              }}
            >
              <Ionicons name="close-circle-outline"
                size={16} color="#C62828" />
              <Text style={{
                color: '#C62828', fontSize: 12,
                marginTop: 2
              }}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}

          {order.status !== 'cancelled' && (
            <TouchableOpacity
              onPress={() => handleOrderMap(order)}
              style={{
                flex: 1, padding: 10, borderRadius: 8,
                backgroundColor: '#E8F5E9',
                borderWidth: 1, borderColor: '#A5D6A7',
                alignItems: 'center', marginLeft: 6
              }}
            >
              <Ionicons name="location-outline"
                size={16} color="#2E7D32" />
              <Text style={{
                color: '#2E7D32', fontSize: 12,
                marginTop: 2
              }}>
                View Location
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>My Purchases</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F772D" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView ref={scrollRef} style={styles.container} showsVerticalScrollIndicator={false}>
          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cart-outline" size={80} color="#D1D5DB" />
              <Text style={styles.emptyText}>No purchases yet</Text>
              <TouchableOpacity
                style={styles.shopBtn}
                onPress={() => router.push("/(tabs)/buyer/BuyerDashboard" as any)}
              >
                <Text style={styles.shopBtnText}>Start Shopping</Text>
              </TouchableOpacity>
            </View>
          ) : (
            orders.map((order, index) => (
              <OrderCard
                key={order.id}
                order={order}
                index={index}
              />
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Order Location Map Modal */}
      <Modal visible={orderMapVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.mapHeader}>
            <View>
              <Text style={styles.mapTitle}>Pickup Location</Text>
              <Text style={styles.mapSubTitle}>
                {selectedOrder?.wasteType} Waste - Rs {selectedOrder?.totalPrice}
              </Text>
              {routeDistance && (
                <Text style={styles.routeInfo}>{routeDistance} km away · straight line</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setOrderMapVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <MapView
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={buyerLocation && sellerLocation ? {
              latitude: (buyerLocation.latitude + sellerLocation.latitude) / 2,
              longitude: (buyerLocation.longitude + sellerLocation.longitude) / 2,
              latitudeDelta: Math.abs(buyerLocation.latitude - sellerLocation.latitude) * 2,
              longitudeDelta: Math.abs(buyerLocation.longitude - sellerLocation.longitude) * 2,
            } : undefined}
          >
            {buyerLocation && sellerLocation && (
              <>
                <Marker coordinate={buyerLocation} title="You" />
                <Marker coordinate={sellerLocation} title="Seller Location">
                  <Ionicons name="location" size={40} color="#4F772D" />
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
            <View style={[
              styles.statusBanner,
              selectedOrder?.status === 'confirmed' ? { backgroundColor: '#E8F5E9' } : { backgroundColor: '#FFF3E0' }
            ]}>
              <Ionicons
                name={selectedOrder?.status === 'confirmed' ? "checkmark-circle" : "time"}
                size={20} color={selectedOrder?.status === 'confirmed' ? "#2E7D32" : "#E65100"}
              />
              {selectedOrder && (
                <Text style={{
                  fontWeight: '700', fontSize: 14,
                  color: selectedOrder.status === 'confirmed' ? "#2E7D32" : "#E65100"
                }}>
                  Order Status: {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </Text>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F5F9F4" },
  container: { flex: 1, padding: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 60, marginBottom: 10 },
  backBtn: { padding: 8, backgroundColor: "#fff", borderRadius: 12, elevation: 2 },
  title: { fontSize: 22, fontWeight: "bold", color: "#111827" },

  orderCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardType: { fontSize: 16, fontWeight: '700', color: '#111827' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pendingBadge: { backgroundColor: '#FFF3E0' },
  confirmedBadge: { backgroundColor: '#E3F2FD' },
  completedBadge: { backgroundColor: '#E8F5E9' },
  cancelledBadge: { backgroundColor: '#FFEBEE' },
  statusText: { fontSize: 12, fontWeight: '700' },

  cardInfo: { marginBottom: 12 },
  infoLine: { fontSize: 14, color: '#4B5563', marginBottom: 4 },
  bold: { fontWeight: '600', color: '#111827' },

  paymentBadgeRow: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  miniBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 0 },

  cardActions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtnCancel: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#EF9A9A', alignItems: 'center', marginRight: 6, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  actionBtnMap: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#A5D6A7', alignItems: 'center', marginLeft: 6, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  actionBtnTextCancel: { color: '#C62828', fontSize: 12, fontWeight: '700' },
  actionBtnTextMap: { color: '#2E7D32', fontSize: 12, fontWeight: '700' },

  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, color: '#9CA3AF', marginTop: 15, marginBottom: 20 },
  shopBtn: { backgroundColor: '#4F772D', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25 },
  shopBtnText: { color: '#fff', fontWeight: 'bold' },

  // Map Modal
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  mapTitle: { fontSize: 18, fontWeight: 'bold' },
  mapSubTitle: { fontSize: 14, color: '#666' },
  routeInfo: { fontSize: 12, color: '#4F772D', fontWeight: '600', marginTop: 2 },
  closeBtn: { padding: 5 },
  mapFooter: { padding: 20, backgroundColor: '#fff' },
  statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, gap: 8 },
  confirmedBanner: { backgroundColor: '#E8F5E9' },
  pendingBanner: { backgroundColor: '#FFF3E0' },
  statusBannerText: { fontWeight: '700', fontSize: 14 }
});
