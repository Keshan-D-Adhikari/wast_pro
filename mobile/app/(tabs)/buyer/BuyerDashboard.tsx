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
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { db, auth, functions } from "../../../firebaseConfig";
import { httpsCallable } from "firebase/functions";
import { FirebaseError } from "firebase/app";
import {
  collection,
  onSnapshot,
  query,
  where,
  addDoc,
  doc,
  serverTimestamp,
  getDoc,
  writeBatch
} from "firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline, APP_MAP_PROVIDER, Callout } from "../../../components/platform-map";
import { MarketplaceItem, UserLocation, Offer } from "../../../types";
import { calculateDistance } from "../../../utils/distance";

import { Palette, Space, Radius, Shadow, Type, wasteAccent } from "@/constants/design";
import { Screen, ScreenHeader } from "@/components/ui/screen";
import { Card, SectionTitle, Divider, DetailRow } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { TextField } from "@/components/ui/text-field";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Sheet } from "@/components/ui/sheet";
import { ChipGroup } from "@/components/ui/chip";

const TYPE_FILTERS = [
  { key: 'all', label: 'All types' },
  { key: 'plastic', label: 'Plastic' },
  { key: 'food', label: 'Food' },
  { key: 'metal', label: 'Metal' },
] as const;
type TypeFilterKey = typeof TYPE_FILTERS[number]['key'];

export default function BuyerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilterKey>('all');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [buyingItem, setBuyingItem] = useState<MarketplaceItem | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');

  const [routeDistance, setRouteDistance] = useState<string | null>(null);
  // `any` here is deliberate: MapView's ref type differs between the native
  // (react-native-maps) and web (placeholder) halves of platform-map, and this
  // ref is only ever passed straight through to <MapView ref={mapRef} />.
  const mapRef = useRef<any>(null);

  // ── Make an Offer state ──────────────────────────────────────────────────
  const [offerItem, setOfferItem] = useState<MarketplaceItem | null>(null);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerAmountError, setOfferAmountError] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          setUserLocation(loc.coords);
        }
      } catch (err) { console.warn('Location unavailable:', err); }

      const q = query(collection(db, "marketplace"), where("status", "==", "available"));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const itemList = snapshot.docs.map(doc => {
          const data = doc.data() as Omit<MarketplaceItem, 'id'>;
          return { id: doc.id, ...data } as MarketplaceItem;
        });
        setItems(itemList);
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

  // Derived from items + searchText — no effect needed, just recompute on render.
  const filteredItems = items.filter(item => {
    const type = (item.wasteType || '').toLowerCase();
    const matchesFilter = typeFilter === 'all' || type === typeFilter;
    const matchesSearch = type.includes(searchText.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getDistance = (sellerLoc: { latitude: number; longitude: number }) => {
    if (!userLocation || !sellerLoc) return "N/A";
    return calculateDistance(
      userLocation.latitude, userLocation.longitude,
      sellerLoc.latitude, sellerLoc.longitude
    ).toFixed(1);
  };

  const handleMakeOffer = (item: MarketplaceItem) => {
    setOfferItem(item);
    setOfferAmount('');
    setOfferAmountError('');
    setOfferModalVisible(true);
  };

  const handleSubmitOffer = async () => {
    if (!auth.currentUser || !offerItem) return;

    const parsed = parseFloat(offerAmount);
    if (!offerAmount || isNaN(parsed) || parsed <= 0) {
      setOfferAmountError('Please enter a valid offer amount greater than 0.');
      return;
    }

    setOfferLoading(true);
    try {
      const buyerDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const buyerName = buyerDoc.exists()
        ? (buyerDoc.data()?.fullName || 'Buyer')
        : 'Buyer';

      // Re-check the listing is still available before submitting
      const listingSnap = await getDoc(doc(db, 'marketplace', offerItem.id));
      if (!listingSnap.exists() || listingSnap.data().status !== 'available') {
        Alert.alert('Listing unavailable', 'This listing has already been sold.');
        setOfferModalVisible(false);
        return;
      }

      const offerData: Omit<Offer, 'id'> = {
        listingId: offerItem.id,
        buyerUid: auth.currentUser.uid,
        buyerName,
        sellerUid: offerItem.sellerUid,
        sellerName: offerItem.sellerName,
        wasteType: offerItem.wasteType,
        weightKg: offerItem.weightKg,
        askingPrice: offerItem.totalPrice,
        offeredPrice: parsed,
        status: 'pending',
        createdAt: serverTimestamp() as any,
        updatedAt: null,
      };

      const offerRef = await addDoc(collection(db, 'offers'), offerData);

      // Notify seller
      await addDoc(collection(db, 'notifications'), {
        toUid: offerItem.sellerUid,
        type: 'offer_received',
        message: `${buyerName} made an offer of Rs ${parsed} for your ${offerItem.wasteType} waste (asking Rs ${offerItem.totalPrice}).`,
        read: false,
        createdAt: serverTimestamp(),
        offerId: offerRef.id,
      });

      setOfferModalVisible(false);
      setOfferItem(null);
      setOfferAmount('');
      Alert.alert('Offer submitted!', `Your offer of Rs ${parsed} has been sent to ${offerItem.sellerName}. Check My Offers for updates.`);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not submit offer. Please try again.');
    } finally {
      setOfferLoading(false);
    }
  };

  const handleBuyNow = (item: MarketplaceItem) => {
    setBuyingItem(item);
    setPaymentMethod('');
    setPaymentModalVisible(true);
  };

  const confirmPurchase = async (method: 'cash' | 'card', cardLast4?: string | null) => {
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
        paymentLast4: method === 'card' ? (cardLast4 ?? null) : null,
        status: (method === 'card' ? 'confirmed' : 'pending') as 'pending' | 'confirmed' | 'completed' | 'cancelled',
        location: buyingItem.location,
        createdAt: serverTimestamp(),
        cancelledAt: null
      };

      // Create the order and flip the listing to sold in ONE atomic batch.
      // Firestore rules require the listing to still be 'available' at commit
      // time, so if another buyer got there first this whole batch is rejected
      // (no order is created) instead of both buyers "buying" the same listing.
      const orderRef = doc(collection(db, "orders"));
      const batch = writeBatch(db);
      batch.set(orderRef, orderData);
      batch.update(doc(db, "marketplace", buyingItem.id), {
        status: "sold",
        soldOrderId: orderRef.id,
      });
      try {
        await batch.commit();
      } catch (e) {
        if (e instanceof FirebaseError && e.code === 'permission-denied') {
          throw new Error('Sorry, this listing was just bought by someone else or is no longer available.');
        }
        throw e;
      }

      const notificationMsg = buyerName + ' placed an order for your '
        + buyingItem.wasteType + ' waste - Rs '
        + buyingItem.totalPrice
        + (method === 'card' ? ' (PAID)' : ' (Cash on Delivery)');

      // orderId lets Firestore rules verify the sender/recipient are
      // actually the two parties on this order (see firestore.rules).
      await addDoc(collection(db, "notifications"), {
        toUid: buyingItem.sellerUid,
        type: "order_placed",
        message: notificationMsg,
        read: false,
        createdAt: serverTimestamp(),
        orderId: orderRef.id,
      });

      setPaymentModalVisible(false);
      setBuyingItem(null);
      setPaymentMethod('');

      if (method === 'card') {
        Alert.alert(
          "Payment Successful!",
          'Rs ' + orderData.totalPrice + ' charged to card' +
            (orderData.paymentLast4 ? ' ending in ' + orderData.paymentLast4 : '') + '.'
        );
      } else {
        Alert.alert("Order Placed!", 'Pay Rs ' + orderData.totalPrice + ' in cash when seller delivers.');
      }

      router.push("/(tabs)/buyer/BuyerOrders");
    } catch (error: unknown) {
      Alert.alert("Error", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setPurchaseLoading(false);
    }
  };

  // Real card payment: a Cloud Function creates a Stripe Checkout Session
  // (test mode) server-side — the secret key never touches the client —
  // and the browser redirects back into the app via a custom-scheme URL, so
  // no native Stripe SDK/dev build is needed; this works in Expo Go too.
  const handleCardPayment = async () => {
    if (!buyingItem) return;

    setPurchaseLoading(true);
    try {
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      const { data } = await createCheckoutSession({
        amount: buyingItem.totalPrice,
        wasteType: buyingItem.wasteType,
        listingId: buyingItem.id,
      }) as { data: { url: string; sessionId: string } };

      const redirectUrl = Linking.createURL('payment-complete');
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type !== 'success' || !result.url) {
        return; // user cancelled/dismissed the checkout page
      }

      const { queryParams } = Linking.parse(result.url);
      if (queryParams?.status !== 'success' || !queryParams?.session_id) {
        Alert.alert('Payment cancelled', 'The payment was not completed.');
        return;
      }

      const verifyCheckoutSession = httpsCallable(functions, 'verifyCheckoutSession');
      const { data: verification } = await verifyCheckoutSession({
        sessionId: queryParams.session_id,
      }) as { data: { paid: boolean; last4: string | null } };

      if (!verification.paid) {
        Alert.alert('Payment not confirmed', 'Please try again.');
        return;
      }

      await confirmPurchase('card', verification.last4);
    } catch (error: unknown) {
      Alert.alert('Payment failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleConfirmOrder = () => {
    if (paymentMethod === 'cash') confirmPurchase('cash');
    else if (paymentMethod === 'card') handleCardPayment();
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
      console.warn('Map error:', error);
      Alert.alert('Error', 'Could not open map');
    }
  };

  /* ================= LISTING CARD ================= */
  const ListingCard = ({ item }: { item: MarketplaceItem }) => {
    const accent = wasteAccent(item.wasteType);
    const distance = getDistance(item.location);
    const pricePerKg = item.weightKg ? (item.totalPrice / item.weightKg) : 0;

    return (
      <Card elevation={2} style={styles.listingCard}>
        <View style={styles.listingHeader}>
          <View style={[styles.listingIcon, { backgroundColor: accent.tint, borderColor: accent.base + '22' }]}>
            <Ionicons name="cube" size={24} color={accent.base} />
          </View>
          <View style={styles.listingTitleBlock}>
            <Text style={[Type.bodyStrong, styles.listingType]} numberOfLines={1}>
              {item.wasteType} waste
            </Text>
            <Text style={Type.caption} numberOfLines={1}>{item.sellerName}</Text>
          </View>
          <View style={[styles.priceRibbon, { backgroundColor: accent.base }]}>
            <Text style={styles.priceRibbonText}>Rs {item.totalPrice || 0}</Text>
          </View>
        </View>

        <View style={styles.distanceRow}>
          <Badge
            label={distance === 'N/A' ? 'Distance N/A' : `${distance} km away`}
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
        <Button
          label="Make an Offer"
          icon="pricetag-outline"
          variant="secondary"
          onPress={() => handleMakeOffer(item)}
          style={styles.offerBtn}
        />
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

        <ChipGroup options={TYPE_FILTERS} value={typeFilter} onChange={setTypeFilter} />

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
            provider={APP_MAP_PROVIDER}
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

        {/* Stripe Checkout notice */}
        {paymentMethod === 'card' && (
          <View style={styles.cardForm}>
            <Text style={Type.caption}>SECURE CHECKOUT</Text>
            <Text style={styles.demoNote}>
              You’ll be taken to Stripe’s secure payment page to enter your card details.
              Card numbers are never seen or stored by this app. (Test mode — no real charge.)
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

      {/* Make an Offer Sheet */}
      <Sheet
        visible={offerModalVisible}
        title="Make an offer"
        onClose={() => {
          setOfferModalVisible(false);
          setOfferAmount('');
          setOfferAmountError('');
        }}
        scrollable
      >
        <Card tone="brand" elevation={0} style={styles.summaryCard}>
          <DetailRow label="Waste type" value={offerItem?.wasteType ?? '—'} />
          <DetailRow label="Weight" value={`${offerItem?.weightKg ?? 0} kg`} />
          <DetailRow label="Seller" value={offerItem?.sellerName ?? '—'} />
          <Divider />
          <DetailRow label="Asking price" value={`Rs ${offerItem?.totalPrice ?? 0}`} emphasis />
        </Card>

        <TextField
          label="Your offer (Rs)"
          icon="pricetag-outline"
          value={offerAmount}
          onChangeText={(t) => {
            setOfferAmount(t.replace(/[^0-9.]/g, ''));
            setOfferAmountError('');
          }}
          keyboardType="decimal-pad"
          placeholder="e.g. 400"
          error={offerAmountError}
        />

        <Button
          label="Submit offer"
          icon="checkmark-outline"
          onPress={handleSubmitOffer}
          loading={offerLoading}
          style={{ marginTop: Space.sm }}
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

  search: { marginBottom: Space.md },

  listingCard: { marginBottom: Space.lg },
  offerBtn: { marginTop: Space.sm },
  listingHeader: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  listingIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingTitleBlock: { flex: 1, gap: 2 },
  listingType: { textTransform: 'capitalize' },
  priceRibbon: {
    paddingHorizontal: Space.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  priceRibbonText: { ...Type.smallStrong, color: Palette.white, fontWeight: '800' },
  distanceRow: { marginTop: Space.md },
  listingMetrics: { flexDirection: 'row', gap: Space.md },
  metricBlock: { flex: 1, gap: 2 },
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

  cardForm: { marginBottom: Space.sm, gap: Space.xs },
  demoNote: { ...Type.caption, color: Palette.ink[300], marginBottom: Space.lg },
});
