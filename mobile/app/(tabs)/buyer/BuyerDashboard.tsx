import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import { db, auth } from "../../../firebaseConfig";
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  getDoc 
} from "firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Callout } from "react-native-maps";
import { MarketplaceItem, UserLocation } from "../../../types";

export default function BuyerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MarketplaceItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [buyingItem, setBuyingItem] = useState<MarketplaceItem | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [cardDetails, setCardDetails] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: ''
  });

  const [routeDistance, setRouteDistance] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          setUserLocation(loc.coords);
        }
      } catch (err) { console.log(err); }

      const q = query(collection(db, "marketplace"), where("status", "==", "available"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const itemList = snapshot.docs.map(doc => {
          const data = doc.data() as Omit<MarketplaceItem, 'id'>;
          return { id: doc.id, ...data } as MarketplaceItem;
        });
        setItems(itemList);
        setFilteredItems(itemList);
        setLoading(false);
      }, (error) => {
        console.error("Firestore onSnapshot error:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    })();
  }, []);

  useEffect(() => {
    const filtered = items.filter(item =>
      (item.wasteType || '').toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchText, items]);

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

  const getDistance = (sellerLoc: { latitude: number; longitude: number }) => {
    if (!userLocation || !sellerLoc) return "N/A";
    return calculateDistance(
      userLocation.latitude, userLocation.longitude,
      sellerLoc.latitude, sellerLoc.longitude
    ).toFixed(1);
  };

  const handleBuyNow = (item: MarketplaceItem) => {
    setBuyingItem(item);
    setPaymentMethod('');
    setPaymentModalVisible(true);
  };

  const confirmPurchase = async (method: 'cash' | 'card', cardInfo?: { number: string }) => {
    if (!auth.currentUser || !buyingItem) return;

    setPurchaseLoading(true);
    try {
      const buyerDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const buyerData = buyerDoc.data();
      const buyerName = buyerDoc.exists() ? (buyerData?.fullName || buyerData?.name) : "Guest Buyer";

      const orderData = {
        listingId: buyingItem.id,
        buyerUid: auth.currentUser.uid,
        buyerName: buyerName,
        sellerUid: buyingItem.sellerUid,
        sellerName: buyingItem.sellerName,
        wasteType: buyingItem.wasteType,
        weightKg: buyingItem.weightKg,
        totalPrice: buyingItem.totalPrice,
        paymentMethod: method,
        paymentStatus: (method === 'card' ? 'paid' : 'pending') as 'paid' | 'pending',
        paymentLast4: method === 'card' && cardInfo ? cardInfo.number.slice(-4) : null,
        status: (method === 'card' ? 'confirmed' : 'pending') as 'pending' | 'confirmed' | 'completed' | 'cancelled',
        location: buyingItem.location,
        createdAt: serverTimestamp(),
        cancelledAt: null
      };

      await addDoc(collection(db, "orders"), orderData);

      await updateDoc(doc(db, "marketplace", buyingItem.id), {
        status: "sold"
      });

      const notificationMsg = buyerName + ' placed an order for your ' 
        + buyingItem.wasteType + ' waste - Rs ' 
        + buyingItem.totalPrice 
        + (method==='card' ? ' (PAID)' : ' (Cash on Delivery)');

      await addDoc(collection(db, "notifications"), {
        toUid: buyingItem.sellerUid,
        type: "order_placed",
        message: notificationMsg,
        read: false,
        createdAt: serverTimestamp(),
      });

      setPaymentModalVisible(false);
      setBuyingItem(null);
      setPaymentMethod('');
      setCardDetails({ name: '', number: '', expiry: '', cvv: '' });

      if (method === 'card' && cardInfo) {
        Alert.alert("Payment Successful!", 'Rs ' + orderData.totalPrice + ' charged to card ending in ' + orderData.paymentLast4);
      } else {
        Alert.alert("Order Placed!", 'Pay Rs ' + orderData.totalPrice + ' in cash when seller delivers.');
      }

      router.push("/(tabs)/buyer/BuyerOrders" as any);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleCardPayment = () => {
    const { name, number, expiry, cvv } = cardDetails;
    if (!name || !number || !expiry || !cvv) {
      Alert.alert("Missing Info", "Please fill in all card details.");
      return;
    }
    if (number.length !== 16) {
      Alert.alert("Invalid Card", "Card number must be exactly 16 digits.");
      return;
    }
    if (cvv.length !== 3) {
      Alert.alert("Invalid CVV", "CVV must be exactly 3 digits.");
      return;
    }

    setPurchaseLoading(true);
    setTimeout(() => {
      confirmPurchase('card', cardDetails);
    }, 2000);
  };

  const handleConfirmOrder = () => {
    if (paymentMethod === 'cash') confirmPurchase('cash');
    else if (paymentMethod === 'card') handleCardPayment();
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const matched = cleaned.match(/.{1,4}/g);
    return matched ? matched.join(' ') : cleaned;
  };

  const getCardType = (number: string) => {
    if (number.startsWith('4')) return 'VISA';
    if (number.startsWith('5')) return 'Mastercard';
    return null;
  };

  if (loading) return <ActivityIndicator size="large" color="#4F772D" style={{ flex: 1 }} />;

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Buyer Dashboard</Text>
        <TextInput
          placeholder="Search waste (Plastic, Paper...)"
          style={styles.search}
          value={searchText}
          onChangeText={setSearchText}
        />
        <Text style={styles.sectionTitle}>Available Marketplace</Text>
        {filteredItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.wasteType}>{item.wasteType} Waste</Text>
              <Text style={styles.distance}>📍 {getDistance(item.location)} km</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>Weight: {item.weightKg} kg</Text>
              <Text style={styles.priceText}>Price: Rs {item.totalPrice || 0}</Text>
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.mapBtn} onPress={async () => {
                try {
                  setSelectedItem(item);

                  const { status } = await Location.requestForegroundPermissionsAsync();
                  if (status !== 'granted') {
                    Alert.alert('Permission needed', 'Please allow location access');
                    return;
                  }

                  const pos = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                  });

                  const buyer = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                  };

                  const seller = {
                    latitude: item.location.latitude,
                    longitude: item.location.longitude
                  };

                  setUserLocation(buyer);

                  const dist = calculateDistance(
                    buyer.latitude, buyer.longitude,
                    seller.latitude, seller.longitude
                  );
                  setRouteDistance(dist.toFixed(1));

                  setMapModalVisible(true);
                } catch (error) {
                  console.log('Map error:', error);
                  Alert.alert('Error', 'Could not open map');
                }
              }}>
                <Text style={styles.mapBtnText}>Map</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buyBtn} onPress={() => handleBuyNow(item)}>
                <Text style={styles.buyBtnText}>Buy Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Map Modal */}
      <Modal visible={mapModalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.mapModalHeader}>
            <View>
              <Text style={styles.mapModalTitle}>Pickup Route</Text>
              <Text style={styles.mapModalDistance}>
                {routeDistance ? `${routeDistance} km away` : 'Calculating...'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => {
              setMapModalVisible(false);
              setRouteDistance(null);
            }} style={styles.closeMapBtn}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.fullMap}
            initialRegion={userLocation && selectedItem ? {
              latitude: (userLocation.latitude + selectedItem.location.latitude) / 2,
              longitude: (userLocation.longitude + selectedItem.location.longitude) / 2,
              latitudeDelta: Math.abs(userLocation.latitude - selectedItem.location.latitude) * 2.5,
              longitudeDelta: Math.abs(userLocation.longitude - selectedItem.location.longitude) * 2.5,
            } : {
              latitude: selectedItem?.location?.latitude || 6.9271,
              longitude: selectedItem?.location?.longitude || 79.8612,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {selectedItem && userLocation && (
              <>
                {/* Buyer Marker - Blue Dot */}
                <Marker
                  coordinate={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude
                  }}
                  title="Your Location"
                >
                  <View style={{
                    width: 22, height: 22, borderRadius: 11,
                    backgroundColor: '#4285F4',
                    borderWidth: 3, borderColor: 'white',
                    elevation: 5
                  }} />
                </Marker>

                {/* Seller Marker */}
                <Marker
                  coordinate={{
                    latitude: selectedItem.location.latitude,
                    longitude: selectedItem.location.longitude,
                  }}
                  title={selectedItem.sellerName}
                >
                  <Ionicons name="location" size={40} color="#4F772D" />
                  <Callout>
                    <View style={styles.calloutContainer}>
                      <Text style={styles.calloutTitle}>{selectedItem.sellerName}</Text>
                      <Text style={styles.calloutText}>{selectedItem.wasteType} Waste</Text>
                      <Text style={styles.calloutText}>{selectedItem.weightKg} kg | Rs {selectedItem.totalPrice}</Text>
                    </View>
                  </Callout>
                </Marker>

                {/* Straight Line Route */}
                <Polyline
                  coordinates={[
                    { latitude: userLocation.latitude, longitude: userLocation.longitude },
                    { latitude: selectedItem.location.latitude, longitude: selectedItem.location.longitude }
                  ]}
                  strokeColor="#4285F4"
                  strokeWidth={4}
                  lineDashPattern={[10, 5]}
                />
              </>
            )}
          </MapView>

          <View style={{
            backgroundColor: 'white',
            padding: 16,
            borderTopWidth: 0.5,
            borderTopColor: '#eee'
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <View style={{
                backgroundColor: '#E8F5E9',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginRight: 10,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color="#4F772D"
                  style={{ marginRight: 6 }}
                />
                <Text style={{
                  color: '#4F772D',
                  fontWeight: '700',
                  fontSize: 16
                }}>
                  {routeDistance
                    ? routeDistance + ' km away'
                    : 'Calculating...'}
                </Text>
              </View>
              <Text style={{
                color: '#888',
                fontSize: 12
              }}>
                straight line distance
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                setMapModalVisible(false);
                setTimeout(() => {
                  if (selectedItem) {
                    handleBuyNow(selectedItem);
                  }
                }, 300);
              }}
              style={{
                backgroundColor: '#4F772D',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center'
              }}
            >
              <Ionicons
                name="cart-outline"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '700'
              }}>
                Buy Now · Rs {selectedItem?.totalPrice}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Payment Selection Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Complete Purchase</Text>

            {/* Order Summary Card */}
            <View style={{
              backgroundColor: '#f9f9f9',
              borderRadius: 10,
              padding: 15,
              marginBottom: 20
            }}>
              <Text style={styles.summaryText}>Waste Type: <Text style={styles.bold}>{buyingItem?.wasteType}</Text></Text>
              <Text style={styles.summaryText}>Weight: <Text style={styles.bold}>{buyingItem?.weightKg} kg</Text></Text>
              <Text style={styles.summaryText}>Seller: <Text style={styles.bold}>{buyingItem?.sellerName}</Text></Text>
              <Text style={styles.summaryText}>Total: <Text style={[styles.bold, { color: '#4F772D' }]}>Rs {buyingItem?.totalPrice}</Text></Text>
            </View>

            {/* Payment Options Side by Side */}
            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
              <TouchableOpacity
                onPress={() => setPaymentMethod('cash')}
                style={{
                  flex: 1, padding: 15, borderRadius: 10,
                  borderWidth: paymentMethod === 'cash' ? 2 : 1,
                  borderColor: paymentMethod === 'cash' ? '#4F772D' : '#ddd',
                  backgroundColor: paymentMethod === 'cash' ? '#E8F5E9' : 'white',
                  marginRight: 8, alignItems: 'center'
                }}
              >
                <Ionicons name="cash-outline" size={30} color="#4F772D" />
                <Text style={{ fontWeight: '600', marginTop: 8 }}>Cash on Delivery</Text>
                <Text style={{ fontSize: 11, color: '#888', textAlign: 'center' }}>Pay when collected</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPaymentMethod('card')}
                style={{
                  flex: 1, padding: 15, borderRadius: 10,
                  borderWidth: paymentMethod === 'card' ? 2 : 1,
                  borderColor: paymentMethod === 'card' ? '#4F772D' : '#ddd',
                  backgroundColor: paymentMethod === 'card' ? '#E8F5E9' : 'white',
                  marginLeft: 8, alignItems: 'center'
                }}
              >
                <Ionicons name="card-outline" size={30} color="#4F772D" />
                <Text style={{ fontWeight: '600', marginTop: 8 }}>Card Payment</Text>
                <Text style={{ fontSize: 11, color: '#888', textAlign: 'center' }}>Pay now securely</Text>
              </TouchableOpacity>
            </View>

            {/* Card Form */}
            {paymentMethod === 'card' && (
              <View style={{ marginTop: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={styles.inputLabel}>Card Details</Text>
                  {getCardType(cardDetails.number) && (
                    <View style={styles.cardBadge}>
                      <Text style={styles.cardBadgeText}>{getCardType(cardDetails.number)}</Text>
                    </View>
                  )}
                </View>
                <TextInput
                  style={styles.cardInput}
                  placeholder="Cardholder Name"
                  value={cardDetails.name}
                  onChangeText={(t) => setCardDetails({ ...cardDetails, name: t })}
                />
                <TextInput
                  style={styles.cardInput}
                  placeholder="Card Number (16 digits)"
                  keyboardType="numeric"
                  maxLength={16}
                  value={cardDetails.number}
                  onChangeText={(t) => setCardDetails({ ...cardDetails, number: t.replace(/\D/g, '') })}
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TextInput
                    style={[styles.cardInput, { flex: 1 }]}
                    placeholder="MM/YY"
                    maxLength={5}
                    value={cardDetails.expiry}
                    onChangeText={(t) => setCardDetails({ ...cardDetails, expiry: t })}
                  />
                  <TextInput
                    style={[styles.cardInput, { flex: 1 }]}
                    placeholder="CVV"
                    keyboardType="numeric"
                    maxLength={3}
                    secureTextEntry
                    value={cardDetails.cvv}
                    onChangeText={(t) => setCardDetails({ ...cardDetails, cvv: t })}
                  />
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={handleConfirmOrder}
              disabled={!paymentMethod}
              style={{
                backgroundColor: paymentMethod ? '#4F772D' : '#ccc',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 20
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '700'
              }}>
                {paymentMethod === 'card' ? 'Pay Now' : 'Confirm Order'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelBtn, { marginTop: 10, borderWidth: 0 }]}
              onPress={() => {
                setPaymentModalVisible(false);
                setPaymentMethod('');
                setCardDetails({ name: '', number: '', expiry: '', cvv: '' });
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>



      {/* Bottom Bar (Updated) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#4F772D" />
          <Text style={[styles.navText, { color: "#4F772D" }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/buyer/BuyerOrders" as any)}>
          <Ionicons name="cart-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/buyer/BuyerProfile" as any)}>
          <Ionicons name="person-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F5F9F4" },
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { fontSize: 26, fontWeight: "700", color: "#111827", marginBottom: 20 },
  search: { borderWidth: 1, borderColor: "#D1D5DB", backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 14, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  wasteType: { fontSize: 16, fontWeight: "700" },
  distance: { fontSize: 13, color: "#4F772D" },
  detailText: { fontSize: 14, color: "#4B5563", marginVertical: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  priceText: { fontSize: 14, fontWeight: '700', color: '#4F772D' },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 10 },
  mapBtn: { flex: 1, backgroundColor: "#E5E7EB", padding: 12, borderRadius: 10, alignItems: "center" },
  mapBtnText: { color: "#374151", fontWeight: "bold" },
  buyBtn: { flex: 1, backgroundColor: "#4F772D", padding: 12, borderRadius: 10, alignItems: "center" },
  buyBtnText: { color: "#fff", fontWeight: "bold" },
  backBtn: { position: 'absolute', top: 50, left: 20, backgroundColor: '#4F772D', padding: 12, borderRadius: 30, flexDirection: 'row', alignItems: 'center' },
  backBtnText: { color: '#fff', marginLeft: 8, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  confirmCard: { backgroundColor: '#fff', width: '85%', borderRadius: 20, padding: 24 },
  confirmTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  confirmDetails: { marginBottom: 20 },
  confirmLabel: { fontSize: 15, color: '#666', marginBottom: 5 },
  confirmValue: { fontWeight: 'bold', color: '#111' },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' },
  cancelBtnText: { color: '#666', fontWeight: 'bold' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#4F772D', alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: 'bold' },
  bottomBar: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#fff", paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  navItem: { alignItems: "center" },
  navText: { fontSize: 12, marginTop: 4 },

  // Map Modal Styles
  mapModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  mapModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  mapModalDistance: { fontSize: 14, color: '#4F772D', fontWeight: '600' },
  mapModalDuration: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  closeMapBtn: { padding: 4 },
  fullMap: { flex: 1 },
  mapFooter: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  mapBuyBtn: { backgroundColor: '#4F772D', padding: 16, borderRadius: 12, alignItems: 'center' },
  mapBuyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  calloutContainer: { width: 150, padding: 5 },
  calloutTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  calloutText: { fontSize: 12, color: '#4B5563' },

  // Payment UI Styles
  summaryBox: { backgroundColor: '#F9FAFB', padding: 15, borderRadius: 12, marginBottom: 20 },
  summaryText: { fontSize: 14, color: '#4B5563', marginBottom: 4 },
  paymentLabel: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 12 },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12
  },
  selectedOption: { backgroundColor: '#E8F5E9', borderColor: '#4F772D' },
  paymentIcon: { width: 45, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  optionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  optionSub: { fontSize: 13, color: '#6B7280' },
  checkIcon: { position: 'absolute', right: 15 },

  // Card Form Styles
  cardModalHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 20 },
  cardBadge: { position: 'absolute', right: 0, backgroundColor: '#4F772D', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  cardBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  inputLabel: { fontSize: 13, color: '#6B7280', marginBottom: 6, fontWeight: '500' },
  cardInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 15, color: '#111827' },
  bold: { fontWeight: '700', color: '#111827' }
});