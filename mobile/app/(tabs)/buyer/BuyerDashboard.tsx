import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
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

import { Palette, Space, Radius, Shadow, Type, wasteAccent } from "@/constants/design";
import { Screen, ScreenHeader } from "@/components/ui/screen";
import { Card, SectionTitle, Divider, DetailRow } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { TextField } from "@/components/ui/text-field";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Sheet } from "@/components/ui/sheet";

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
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          setUserLocation(loc.coords);
        }
      } catch (err) { console.log(err); }

      const q = query(collection(db, "marketplace"), where("status", "==", "available"));
      unsubscribe = onSnapshot(q, (snapshot) => {
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
    })();

    // Detach the listener on unmount — returning it from inside the async
    // IIFE above would never reach React
    return () => unsubscribe?.();
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
        + (method === 'card' ? ' (PAID)' : ' (Cash on Delivery)');

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

  const getCardType = (number: string) => {
    if (number.startsWith('4')) return 'VISA';
    if (number.startsWith('5')) return 'Mastercard';
    return null;
  };

  const openRouteMap = async (item: MarketplaceItem) => {
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

      setUserLocation(buyer);

      const dist = calculateDistance(
        buyer.latitude, buyer.longitude,
        item.location.latitude, item.location.longitude
      );
      setRouteDistance(dist.toFixed(1));

      setMapModalVisible(true);
    } catch (error) {
      console.log('Map error:', error);
      Alert.alert('Error', 'Could not open map');
    }
  };

  /* ================= LISTING CARD ================= */
  const ListingCard = ({ item }: { item: MarketplaceItem }) => {
    const accent = wasteAccent(item.wasteType);
    const distance = getDistance(item.location);
    const pricePerKg = item.weightKg ? (item.totalPrice / item.weightKg) : 0;

    return (
      <Card style={styles.listingCard}>
        <View style={styles.listingHeader}>
          <View style={[styles.listingIcon, { backgroundColor: accent.tint }]}>
            <Ionicons name="cube-outline" size={19} color={accent.base} />
          </View>
          <View style={styles.listingTitleBlock}>
            <Text style={[Type.bodyStrong, styles.listingType]} numberOfLines={1}>
              {item.wasteType} waste
            </Text>
            <Text style={Type.caption} numberOfLines={1}>{item.sellerName}</Text>
          </View>
          <Badge
            label={distance === 'N/A' ? 'Distance N/A' : `${distance} km`}
            icon="location-outline"
            color={{ base: Palette.brand[700], tint: Palette.brand[100] }}
          />
        </View>

        <Divider />

        <View style={styles.listingMetrics}>
          <View style={styles.metricBlock}>
            <Text style={Type.caption}>WEIGHT</Text>
            <Text style={Type.bodyStrong}>{item.weightKg} kg</Text>
          </View>
          <View style={styles.metricBlock}>
            <Text style={Type.caption}>RATE</Text>
            <Text style={Type.bodyStrong}>Rs {pricePerKg.toFixed(0)}/kg</Text>
          </View>
          <View style={styles.metricBlock}>
            <Text style={Type.caption}>TOTAL</Text>
            <Text style={styles.listingTotal}>Rs {item.totalPrice || 0}</Text>
          </View>
        </View>

        <View style={styles.listingActions}>
          <Button
            label="Route"
            icon="map-outline"
            variant="secondary"
            onPress={() => openRouteMap(item)}
            style={styles.actionFlex}
          />
          <Button
            label="Buy Now"
            icon="cart-outline"
            onPress={() => handleBuyNow(item)}
            style={styles.actionFlex}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.root}>
      <Screen withBottomNav>
        <ScreenHeader title="Browse waste" subtitle="Find recyclable waste near you" />

        <TextField
          icon="search-outline"
          placeholder="Search waste (plastic, metal, food…)"
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          containerStyle={styles.search}
        />

        {loading ? (
          <LoadingState message="Loading the marketplace…" />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={searchText ? 'search-outline' : 'storefront-outline'}
            title={searchText ? 'No matches' : 'Nothing listed yet'}
            message={
              searchText
                ? `No available waste matches “${searchText}”.`
                : 'Sellers have not listed any waste yet. Check back shortly.'
            }
            actionLabel={searchText ? 'Clear search' : undefined}
            onAction={searchText ? () => setSearchText('') : undefined}
          />
        ) : (
          <>
            <SectionTitle meta={`${filteredItems.length} available`}>
              Available marketplace
            </SectionTitle>
            {filteredItems.map((item) => (
              <ListingCard key={item.id} item={item} />
            ))}
          </>
        )}
      </Screen>

      {/* Map Modal — full screen so the route is readable */}
      <Modal visible={mapModalVisible} animationType="slide">
        <SafeAreaView style={styles.mapModalRoot}>
          <View style={styles.mapModalHeader}>
            <View style={styles.flex}>
              <Text style={Type.h2}>Pickup route</Text>
              <Text style={[Type.small, styles.mapModalMeta]}>
                {routeDistance ? `${routeDistance} km · straight line` : 'Calculating…'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setMapModalVisible(false);
                setRouteDistance(null);
              }}
              style={styles.closeMapBtn}
              hitSlop={8}
            >
              <Ionicons name="close" size={24} color={Palette.ink[700]} />
            </TouchableOpacity>
          </View>

          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.flex}
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
                  <View style={styles.buyerDot} />
                </Marker>

                {/* Seller Marker */}
                <Marker
                  coordinate={{
                    latitude: selectedItem.location.latitude,
                    longitude: selectedItem.location.longitude,
                  }}
                  title={selectedItem.sellerName}
                >
                  <Ionicons name="location" size={38} color={Palette.brand[600]} />
                  <Callout>
                    <View style={styles.callout}>
                      <Text style={Type.smallStrong}>{selectedItem.sellerName}</Text>
                      <Text style={Type.caption}>{selectedItem.wasteType} waste</Text>
                      <Text style={Type.caption}>
                        {selectedItem.weightKg} kg · Rs {selectedItem.totalPrice}
                      </Text>
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

          <View style={styles.mapFooter}>
            <Button
              label={`Buy Now · Rs ${selectedItem?.totalPrice ?? 0}`}
              icon="cart-outline"
              onPress={() => {
                setMapModalVisible(false);
                setTimeout(() => {
                  if (selectedItem) {
                    handleBuyNow(selectedItem);
                  }
                }, 300);
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Payment Sheet */}
      <Sheet
        visible={paymentModalVisible}
        title="Complete purchase"
        onClose={() => {
          setPaymentModalVisible(false);
          setPaymentMethod('');
          setCardDetails({ name: '', number: '', expiry: '', cvv: '' });
        }}
        scrollable
      >
        {/* Order Summary Card */}
        <Card tone="brand" elevation={0} style={styles.summaryCard}>
          <DetailRow label="Waste type" value={buyingItem?.wasteType ?? '—'} />
          <DetailRow label="Weight" value={`${buyingItem?.weightKg ?? 0} kg`} />
          <DetailRow label="Seller" value={buyingItem?.sellerName ?? '—'} />
          <Divider />
          <DetailRow label="Total" value={`Rs ${buyingItem?.totalPrice ?? 0}`} emphasis />
        </Card>

        <Text style={[Type.caption, styles.paymentLabel]}>PAYMENT METHOD</Text>

        <View style={styles.payRow}>
          {([
            { key: 'cash', icon: 'cash-outline', title: 'Cash on delivery', sub: 'Pay when collected' },
            { key: 'card', icon: 'card-outline', title: 'Card payment', sub: 'Pay now' },
          ] as const).map((opt) => {
            const selected = paymentMethod === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setPaymentMethod(opt.key)}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[styles.payOption, selected && styles.payOptionSelected]}
              >
                <Ionicons
                  name={opt.icon}
                  size={24}
                  color={selected ? Palette.brand[600] : Palette.ink[500]}
                />
                <Text style={[Type.smallStrong, styles.payTitle]}>{opt.title}</Text>
                <Text style={styles.paySub}>{opt.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Card Form */}
        {paymentMethod === 'card' && (
          <View style={styles.cardForm}>
            <View style={styles.cardFormHeader}>
              <Text style={Type.caption}>CARD DETAILS</Text>
              {getCardType(cardDetails.number) && (
                <Badge label={getCardType(cardDetails.number)!} tone="info" />
              )}
            </View>

            <TextField
              placeholder="Cardholder name"
              value={cardDetails.name}
              onChangeText={(t) => setCardDetails({ ...cardDetails, name: t })}
            />
            <TextField
              placeholder="Card number (16 digits)"
              keyboardType="numeric"
              maxLength={16}
              value={cardDetails.number}
              onChangeText={(t) => setCardDetails({ ...cardDetails, number: t.replace(/\D/g, '') })}
            />
            <View style={styles.cardRow}>
              <TextField
                placeholder="MM/YY"
                maxLength={5}
                value={cardDetails.expiry}
                onChangeText={(t) => setCardDetails({ ...cardDetails, expiry: t })}
                containerStyle={styles.flex}
              />
              <TextField
                placeholder="CVV"
                keyboardType="numeric"
                maxLength={3}
                secureTextEntry
                value={cardDetails.cvv}
                onChangeText={(t) => setCardDetails({ ...cardDetails, cvv: t })}
                containerStyle={styles.flex}
              />
            </View>

            <Text style={styles.demoNote}>
              Demo checkout — no real payment is processed and card numbers are not stored.
            </Text>
          </View>
        )}

        <Button
          label={paymentMethod === 'card' ? 'Pay now' : 'Confirm order'}
          onPress={handleConfirmOrder}
          disabled={!paymentMethod}
          loading={purchaseLoading}
        />
      </Sheet>

      <BottomNav role="buyer" active="home" />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.background },
  flex: { flex: 1 },

  search: { marginBottom: 0 },

  listingCard: { marginBottom: Space.md },
  listingHeader: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  listingIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingTitleBlock: { flex: 1, gap: 2 },
  listingType: { textTransform: 'capitalize' },
  listingMetrics: { flexDirection: 'row', gap: Space.md },
  metricBlock: { flex: 1, gap: 2 },
  listingTotal: { ...Type.bodyStrong, color: Palette.brand[600], fontWeight: '800' },
  listingActions: { flexDirection: 'row', gap: Space.md, marginTop: Space.lg },
  actionFlex: { flex: 1 },

  // Map Modal
  mapModalRoot: { flex: 1, backgroundColor: Palette.surface },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    padding: Space.xl,
    borderBottomWidth: 1,
    borderBottomColor: Palette.ink[100],
  },
  mapModalMeta: { color: Palette.brand[600], fontWeight: '600', marginTop: 2 },
  closeMapBtn: {
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
  callout: { width: 150, padding: Space.xs, gap: 2 },
  mapFooter: {
    padding: Space.xl,
    backgroundColor: Palette.surface,
    borderTopWidth: 1,
    borderTopColor: Palette.ink[100],
  },

  // Payment
  summaryCard: { marginBottom: Space.xl },
  paymentLabel: { marginBottom: Space.md },
  payRow: { flexDirection: 'row', gap: Space.md, marginBottom: Space.lg },
  payOption: {
    flex: 1,
    alignItems: 'center',
    gap: Space.xs,
    padding: Space.lg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Palette.ink[200],
    backgroundColor: Palette.surface,
  },
  payOptionSelected: { borderColor: Palette.brand[600], backgroundColor: Palette.brand[50] },
  payTitle: { textAlign: 'center' },
  paySub: { ...Type.caption, textAlign: 'center', color: Palette.ink[300] },

  cardForm: { marginBottom: Space.sm },
  cardFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Space.md,
  },
  cardRow: { flexDirection: 'row', gap: Space.md },
  demoNote: { ...Type.caption, color: Palette.ink[300], marginBottom: Space.lg },
});
