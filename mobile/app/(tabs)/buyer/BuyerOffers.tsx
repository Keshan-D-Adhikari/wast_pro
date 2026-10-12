// BuyerOffers ("My offers"): offers the buyer sent to sellers, and their answers.
//
// Who uses it: a logged-in buyer. Reached with the Offers button on BuyerOrders.
// Flow of an offer:
//  1 Buyer sends an offer from BuyerDashboard (offers doc, status "pending").
//  2 Seller accepts or rejects. On accept, an order is created with
//    awaitingBuyer true and status "pending" (the listing is held for this buyer).
//  3 Back here, the buyer chooses "Buy" (order becomes confirmed) or "Decline"
//    (order cancelled and listing goes back to the marketplace).
//
// Firestore collections:
//  - offers         READ (live, only this buyer's)
//  - orders         READ (live, to find the order made from each offer) and UPDATE
//  - marketplace    READ and UPDATE (restore the listing when the buyer declines)
//  - notifications  CREATE (tell the seller the buyer's decision)
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import {
  collection, query, where, onSnapshot, orderBy, updateDoc, doc, getDoc, addDoc, writeBatch, deleteField, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { Offer, Order } from '../../../types';
import { formatRs } from '../../../utils/money';

import { Palette, Space, Radius, Type, wasteAccent } from '@/constants/design';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Card, SectionTitle, Divider, DetailRow } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState, LoadingState } from '@/components/ui/empty-state';
import { BottomNav } from '@/components/ui/bottom-nav';

// Maps an offer status to a badge color.
const offerStatusTone = (s: Offer['status']): 'success' | 'warning' | 'danger' | 'neutral' => {
  if (s === 'accepted') return 'success';
  if (s === 'pending') return 'warning';
  if (s === 'rejected') return 'danger';
  return 'neutral';
};

// The offers screen component.
export default function BuyerOffers() {
  // Logged in Firebase user (null until the saved login is ready).
  const authUser = useAuthUser();
  // offers: this buyer's offers. loading: true until the first data arrives.
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  // The orders created by accepted offers, by offer id (the buyer decides on these)
  const [offerOrders, setOfferOrders] = useState<Record<string, Order>>({});
  // Id of the offer being decided now (so only that card shows a busy state).
  const [decidingId, setDecidingId] = useState<string | null>(null);

  // Effect 1: live list of this buyer's offers, newest first.
  // useEffect runs after the screen draws, and again when authUser changes.
  useEffect(() => {
    if (!authUser) return;

    // Query: only offers where buyerUid is me.
    const q = query(
      collection(db, 'offers'),
      where('buyerUid', '==', authUser.uid),
      orderBy('createdAt', 'desc')
    );

    // onSnapshot is a live listener. It runs now and every time an offer changes,
    // for example when the seller accepts one.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // A withdrawn offer is one the buyer took back, so it is not listed any more.
      setOffers(
        snapshot.docs
          .map(d => ({ id: d.id, ...d.data() } as Offer))
          .filter(o => o.status !== 'withdrawn')
      );
      setLoading(false);
    }, (err) => {
      console.error('BuyerOffers error:', err);
      setLoading(false);
    });

    // Cleanup: stop the listener when the screen closes.
    return () => unsubscribe();
  }, [authUser]);

  // Effect 2: live list of this buyer's orders. We need them to find the order that
  // was created when the seller accepted an offer (it has the same offerId).
  useEffect(() => {
    if (!authUser) return;
    const q = query(collection(db, 'orders'), where('buyerUid', '==', authUser.uid));
    // Returning onSnapshot works as cleanup too, because it returns the unsubscribe function.
    return onSnapshot(q, (snapshot) => {
      const byOffer: Record<string, Order> = {};
      snapshot.docs.forEach((d) => {
        const o = { id: d.id, ...d.data() } as Order;
        if (o.offerId) byOffer[o.offerId] = o;
      });
      setOfferOrders(byOffer);
    }, (err) => console.error('Offer orders error:', err));
  }, [authUser]);

  // Buy: the buyer agrees to the accepted price.
  // Steps: 1 confirm the order, 2 notify the seller, 3 tell the buyer.
  // The seller accepted: the buyer chooses to buy at the accepted price.
  const handleBuy = async (offer: Offer, order: Order) => {
    setDecidingId(offer.id);
    try {
      // Step 1: status "confirmed" and awaitingBuyer false. Payment is done later in
      // My Purchases (card or cash).
      await updateDoc(doc(db, 'orders', order.id), { status: 'confirmed', awaitingBuyer: false });
      // Step 2: notification for the seller.
      await addDoc(collection(db, 'notifications'), {
        toUid: order.sellerUid,
        type: 'order_placed',
        message: `${order.buyerName || 'The buyer'} will buy your ${order.wasteType} waste at ${formatRs(order.totalPrice)}.`,
        read: false,
        createdAt: serverTimestamp(),
        orderId: order.id,
      });
      Alert.alert('Order confirmed', `You will buy this at ${formatRs(order.totalPrice)}. Pay in My Purchases, by card or cash on delivery.`);
    } catch (err) {
      console.error('Buy error:', err);
      Alert.alert('Error', 'Could not confirm the purchase. Please try again.');
    } finally {
      setDecidingId(null);
    }
  };

  // Decline: steps: 1 ask the buyer, 2 cancel the order and restore the listing in one
  // atomic batch, 3 notify the seller.
  // ...or declines: the order is cancelled and the listing goes back on the marketplace.
  const handleDecline = (offer: Offer, order: Order) => {
    Alert.alert('Decline this offer?', 'The listing goes back on the marketplace and you will not buy it at this price.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          setDecidingId(offer.id);
          try {
            // Read the listing to check this order was the one holding it.
            const listingRef = doc(db, 'marketplace', order.listingId);
            const listingSnap = await getDoc(listingRef);
            // writeBatch: all writes succeed together or none do (atomic), so the order and
            // the listing can never get out of step.
            const batch = writeBatch(db);
            batch.update(doc(db, 'orders', order.id), { status: 'cancelled', cancelledAt: serverTimestamp() });
            // Only put the listing back if this order owns it. deleteField removes soldOrderId.
            if (listingSnap.exists() && listingSnap.data().soldOrderId === order.id) {
              batch.update(listingRef, { status: 'available', soldOrderId: deleteField() });
            }
            // Send the batch to Firestore, then notify the seller.
            await batch.commit();
            await addDoc(collection(db, 'notifications'), {
              toUid: order.sellerUid,
              type: 'order_cancelled',
              message: `${order.buyerName || 'The buyer'} declined to buy your ${order.wasteType} waste at ${formatRs(order.totalPrice)}.`,
              read: false,
              createdAt: serverTimestamp(),
              orderId: order.id,
            });
          } catch (err) {
            console.error('Decline error:', err);
            Alert.alert('Error', 'Could not decline. Please try again.');
          } finally {
            setDecidingId(null);
          }
        },
      },
    ]);
  };

  // Split the list: still waiting for the seller, and answered ones.
  const pendingOffers = offers.filter(o => o.status === 'pending');
  const answeredOffers = offers.filter(o => o.status !== 'pending');

  // One offer card. For accepted offers it shows the Buy and Decline buttons.
  const OfferCard = ({ offer }: { offer: Offer }) => {
    // Accent color by waste type and a readable date (or "Just now" before the server
    // has written the time).
    const accent = wasteAccent(offer.wasteType as any);
    const date = offer.createdAt?.toDate ? offer.createdAt.toDate().toLocaleDateString() : 'Just now';

    return (
      <Card style={[styles.card, offer.status === 'accepted' && styles.acceptedCard]}>
        {/* Header: waste icon, type and status badge */}
        <View style={styles.cardHeader}>
          <View style={[styles.typeIcon, { backgroundColor: accent.tint }]}>
            <Ionicons name="cube-outline" size={17} color={accent.base} />
          </View>
          <Text style={[Type.bodyStrong, styles.typeText]} numberOfLines={1}>
            {offer.wasteType} waste
          </Text>
          <Badge label={offer.status} tone={offerStatusTone(offer.status)} />
        </View>

        <Divider />

        {/* Price details */}
        <DetailRow label="Seller" value={offer.sellerName} />
        <DetailRow label="Weight" value={`${offer.weightKg} kg`} />
        <DetailRow label="Asking price" value={formatRs(offer.askingPrice)} />
        <DetailRow label="Your offer" value={formatRs(offer.offeredPrice)} emphasis />
        <DetailRow label="Date" value={date} />

        {/* Accepted offers. This runs a small function right in the JSX (IIFE) so we can */}
        {/* use local variables. */}
        {offer.status === 'accepted' && (() => {
          // The order created from this offer (found by offer id).
          const order = offerOrders[offer.id];
          // waiting: the order exists and the buyer has not decided yet.
          const waiting = !!order && order.status === 'pending' && order.awaitingBuyer === true;
          // declined: the order was cancelled, so the buyer did not buy.
          const declined = !!order && order.status === 'cancelled';
          const tone = declined ? Palette.status.danger.base : Palette.status.success.base;
          return (
            <>
              <View style={styles.acceptedBanner}>
                <Ionicons name={declined ? 'close-circle' : 'checkmark-circle'} size={16} color={tone} />
                <Text style={[Type.caption, { color: tone, fontWeight: '700', flex: 1 }]}>
                  {declined
                    ? 'You did not buy this offer.'
                    : waiting
                      ? `Accepted! Buy it at ${formatRs(offer.offeredPrice)}, or decline.`
                      : 'Offer accepted. Check My Purchases for the order.'}
                </Text>
              </View>
              {/* Buy and Decline buttons, only while waiting for the buyer */}
              {waiting && (
                <View style={styles.decideRow}>
                  <Button
                    label="Decline"
                    variant="danger"
                    style={styles.decideBtn}
                    disabled={decidingId === offer.id}
                    onPress={() => handleDecline(offer, order)}
                  />
                  <Button
                    label={`Buy at ${formatRs(offer.offeredPrice)}`}
                    style={styles.decideBtn}
                    loading={decidingId === offer.id}
                    onPress={() => handleBuy(offer, order)}
                  />
                </View>
              )}
            </>
          );
        })()}

        {/* Pending offers only show a waiting message */}
        {offer.status === 'pending' && (
          <View style={styles.waitingRow}>
            <Ionicons name="time-outline" size={16} color={Palette.status.warning.base} />
            <Text style={[Type.caption, { color: Palette.status.warning.base, fontWeight: '700', flex: 1 }]}>
              Waiting for the seller to accept or reject.
            </Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.root}>
      <Screen withBottomNav>
        {/* Screen header with back button */}
        <ScreenHeader title="My offers" subtitle="Offers you submitted to sellers" back />

        {/* Loading, empty, or the two lists */}
        {loading ? (
          <LoadingState message="Loading your offers…" />
        ) : offers.length === 0 ? (
          <EmptyState
            icon="pricetag-outline"
            title="No offers yet"
            message="Browse the marketplace and tap Make an Offer on a listing to submit your price."
          />
        ) : (
          <>
            {/* An offer leaves "Pending" as soon as the seller accepts or rejects it */}
            {pendingOffers.length > 0 && (
              <>
                <SectionTitle meta={`${pendingOffers.length} pending`}>Pending offers</SectionTitle>
                {pendingOffers.map(o => <OfferCard key={o.id} offer={o} />)}
              </>
            )}
            {answeredOffers.length > 0 && (
              <>
                <SectionTitle meta={`${answeredOffers.length} answered`}>Offer history</SectionTitle>
                {answeredOffers.map(o => <OfferCard key={o.id} offer={o} />)}
              </>
            )}
          </>
        )}
      </Screen>
      {/* Bottom tab bar for buyers (Orders tab is active) */}
      <BottomNav role="buyer" active="orders" />
    </View>
  );
}

// Styles.
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.background },
  card: { marginBottom: Space.md },
  acceptedCard: { borderWidth: 2, borderColor: Palette.status.success.base },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  typeIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: { flex: 1, textTransform: 'capitalize' },
  acceptedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    marginTop: Space.md,
    padding: Space.md,
    borderRadius: Radius.sm,
    backgroundColor: Palette.status.success.tint,
  },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm, marginTop: Space.md },
  decideRow: { flexDirection: 'row', gap: Space.md, marginTop: Space.lg },
  decideBtn: { flex: 1 },
});
