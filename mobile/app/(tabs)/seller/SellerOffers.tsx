// SELLER OFFERS SCREEN
// Who uses it: a seller. It is opened from the "Offers" button on SellerOrders.
// What it does: shows the price offers that buyers made on the seller's marketplace
// listings. The seller can ACCEPT or REJECT each pending offer.
// Data it uses:
//   - offers (read live, filtered by sellerUid; updated to accepted / rejected)
//   - marketplace/{listingId}  (set to "sold" when an offer is accepted)
//   - orders (a new order is created when an offer is accepted)
//   - notifications (a message is written for the buyer after each decision)
// Flow: buyer sends offer -> seller accepts here -> an order is created with
// awaitingBuyer = true -> the buyer then chooses to buy at that price or decline.
// firestore.rules checks these writes (for example that the order matches the offer).
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  runTransaction,
  addDoc,
  serverTimestamp,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';
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

// Maps an offer status to a badge colour: green, yellow, red or grey.
const offerStatusTone = (s: Offer['status']): 'success' | 'warning' | 'danger' | 'neutral' => {
  if (s === 'accepted') return 'success';
  if (s === 'pending') return 'warning';
  if (s === 'rejected') return 'danger';
  return 'neutral';
};

// Main component of the screen.
export default function SellerOffers() {
  // The logged in user. It is null for a moment while Firebase restores the login.
  const authUser = useAuthUser();
  // offers: the seller's offers shown in the lists. loading: show a spinner first.
  // processingId: id of the offer being accepted or rejected, so its buttons show a spinner.
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // useEffect: runs when authUser changes. We start a live listener here.
  useEffect(() => {
    // Wait until we know who the user is.
    if (!authUser) return;

    // Query: every offer where sellerUid is this seller.
    const q = query(
      collection(db, 'offers'),
      where('sellerUid', '==', authUser.uid)
    );

    // onSnapshot is a LIVE listener. Firestore calls this function now and again every time
    // an offer changes, so a new offer appears without refreshing.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Offer))
        // Offers a buyer withdrew earlier are not shown any more
        .filter(o => o.status !== 'withdrawn')
        // Sort: pending first, then by offeredPrice descending so the highest offer is at the top
        .sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          return b.offeredPrice - a.offeredPrice;
        });
      setOffers(list);
      setLoading(false);
    // Error callback: log it and stop the spinner.
    }, (err) => {
      console.error('SellerOffers error:', err);
      setLoading(false);
    });

    // Cleanup. React runs this when the screen closes or authUser changes.
    // It stops the listener so we do not waste data or update a screen that is gone.
    return () => unsubscribe();
  }, [authUser]);

  // Called when the seller taps Accept. First ask for confirmation with an alert.
  const handleAccept = (offer: Offer) => {
    Alert.alert(
      'Accept offer?',
      `Accept Rs ${offer.offeredPrice} from ${offer.buyerName} for ${offer.wasteType} waste?\n\nThe listing is held for this buyer, who then chooses whether to buy at this price. All other pending offers for this listing are rejected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            // Step 0: we need a logged in user.
            if (!auth.currentUser) return;
            setProcessingId(offer.id);
            try {
              // A transaction makes several reads and writes happen together (atomically).
              // Either all of them succeed or none do. It also re-reads the data, so if another
              // change happens at the same time Firestore retries. This stops two offers being
              // accepted for one listing.
              // Use a transaction to atomically: mark offer accepted, mark listing sold, create order
              // Create the id of the new order now, so we can store it on the listing too.
              const orderRef = doc(collection(db, 'orders'));
              await runTransaction(db, async (tx) => {
                // Step 1: read the listing and check it is still available.
                const listingRef = doc(db, 'marketplace', offer.listingId);
                const listingSnap = await tx.get(listingRef);

                if (!listingSnap.exists()) throw new Error('Listing no longer exists.');
                if (listingSnap.data().status !== 'available') throw new Error('This listing is no longer available.');

                // Step 2: read the offer again and check it is still pending.
                const offerRef = doc(db, 'offers', offer.id);
                const offerSnap = await tx.get(offerRef);
                if (!offerSnap.exists() || offerSnap.data().status !== 'pending') {
                  throw new Error('This offer is no longer pending.');
                }

                // Step 3: build the order. It uses the OFFERED price, not the asking price.
                const listing = listingSnap.data();

                // Build order using the OFFERED price, not asking price
                const orderData: Omit<Order, 'id'> = {
                  listingId: offer.listingId,
                  buyerUid: offer.buyerUid,
                  buyerName: offer.buyerName,
                  sellerUid: offer.sellerUid,
                  sellerName: offer.sellerName,
                  wasteType: offer.wasteType,
                  weightKg: offer.weightKg,
                  totalPrice: offer.offeredPrice,
                  // Payment is chosen later by the buyer. These are only starting values.
                  paymentMethod: 'cash',          // buyer chooses payment after buying
                  paymentStatus: 'pending',
                  paymentLast4: null,
                  status: 'pending',
                  // The buyer must still decide to buy at this price or decline.
                  awaitingBuyer: true,         // the buyer now chooses to buy at this price or decline
                  location: listing.location,
                  createdAt: serverTimestamp() as any,
                  cancelledAt: null,
                  // Lets firestore.rules verify this seller-created order
                  // matches the offer being accepted in this transaction.
                  offerId: offer.id,
                };

                // Step 4: the three writes. They are only saved when the transaction commits.
                // Mark offer accepted
                tx.update(offerRef, { status: 'accepted', updatedAt: serverTimestamp() });
                // Mark listing sold
                tx.update(listingRef, { status: 'sold', soldOrderId: orderRef.id });
                // Create order
                tx.set(orderRef, orderData);
              });

              // Step 5: reject the other pending offers on the same listing (outside the transaction).
              // Reject all other pending offers for the same listing (outside the transaction is fine;
              // the listing is now 'sold' so no new offers can be placed)
              // Find the other pending offers for this listing.
              const otherOffersSnap = await getDocs(
                query(collection(db, 'offers'),
                  where('listingId', '==', offer.listingId),
                  where('status', '==', 'pending')
                )
              );
              for (const d of otherOffersSnap.docs) {
                if (d.id !== offer.id) {
                  await updateDoc(doc(db, 'offers', d.id), {
                    status: 'rejected',
                    updatedAt: serverTimestamp(),
                  });
                  // Tell each rejected buyer.
                  // Notify rejected buyers
                  await addDoc(collection(db, 'notifications'), {
                    toUid: d.data().buyerUid,
                    type: 'offer_rejected',
                    message: `Your offer of Rs ${d.data().offeredPrice} for ${d.data().wasteType} waste was not selected.`,
                    read: false,
                    createdAt: serverTimestamp(),
                    offerId: d.id,
                  });
                }
              }

              // Step 6: tell the buyer whose offer was accepted.
              // Notify accepted buyer
              await addDoc(collection(db, 'notifications'), {
                toUid: offer.buyerUid,
                type: 'offer_accepted',
                message: `Your offer of Rs ${offer.offeredPrice} for ${offer.wasteType} waste has been accepted! Open My Offers to buy it at that price or decline.`,
                read: false,
                createdAt: serverTimestamp(),
                offerId: offer.id,
              });

              Alert.alert('Offer accepted', `The buyer has been told and can now buy at Rs ${offer.offeredPrice} or decline.`);
            // If anything failed (for example the listing was sold already) show the message.
            } catch (err: unknown) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Could not accept offer. Please try again.');
            // Always stop the spinner.
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  // Called when the seller taps Reject. The listing stays available for other offers.
  const handleReject = (offer: Offer) => {
    Alert.alert(
      'Reject offer?',
      `Reject Rs ${offer.offeredPrice} from ${offer.buyerName}? The listing will remain available.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(offer.id);
            try {
              // Mark the offer rejected, then tell the buyer.
              await updateDoc(doc(db, 'offers', offer.id), {
                status: 'rejected',
                updatedAt: serverTimestamp(),
              });
              await addDoc(collection(db, 'notifications'), {
                toUid: offer.buyerUid,
                type: 'offer_rejected',
                message: `Your offer of Rs ${offer.offeredPrice} for ${offer.wasteType} waste was rejected.`,
                read: false,
                createdAt: serverTimestamp(),
                offerId: offer.id,
              });
            } catch (err: unknown) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Could not reject offer.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  // Split the list: pending offers go on top, decided offers go to the history.
  const pendingOffers = offers.filter(o => o.status === 'pending');
  const otherOffers = offers.filter(o => o.status !== 'pending');

  // One card for one offer. highest is true for the first (best) pending offer.
  const OfferCard = ({ offer, highest }: { offer: Offer; highest: boolean }) => {
    // Pick the colour for this waste type.
    const accent = wasteAccent(offer.wasteType as any);
    const isPending = offer.status === 'pending';
    const isProcessing = processingId === offer.id;
    // createdAt is a Firestore timestamp. It can be missing just after saving, so show Just now.
    const date = offer.createdAt?.toDate ? offer.createdAt.toDate().toLocaleDateString() : 'Just now';

    // Offer card. The best pending offer gets a coloured border.
    return (
      <Card style={[styles.card, highest && isPending && styles.topOfferCard]}>
        {highest && isPending && (
          <View style={styles.topBadgeRow}>
            <Badge label="Highest offer" tone="success" icon="trending-up-outline" />
          </View>
        )}
        {/* Header: waste icon, type and weight, and the status badge */}
        <View style={styles.cardHeader}>
          <View style={[styles.typeIcon, { backgroundColor: accent.tint }]}>
            <Ionicons name="cube-outline" size={17} color={accent.base} />
          </View>
          <Text style={[Type.bodyStrong, styles.typeText]} numberOfLines={1}>
            {offer.wasteType} waste · {offer.weightKg} kg
          </Text>
          <Badge label={offer.status} tone={offerStatusTone(offer.status)} />
        </View>

        {/* Offer details */}
        <Divider />

        <DetailRow label="Buyer" value={offer.buyerName} />
        <DetailRow label="Asking price" value={formatRs(offer.askingPrice)} />
        <DetailRow label="Offered price" value={formatRs(offer.offeredPrice)} emphasis />
        <DetailRow label="Date" value={date} />

        {/* Reject and Accept buttons, only for pending offers */}
        {isPending && (
          <View style={styles.actionRow}>
            <Button
              label="Reject"
              variant="danger"
              style={styles.actionBtn}
              loading={isProcessing}
              onPress={() => handleReject(offer)}
            />
            <Button
              label="Accept"
              style={styles.actionBtn}
              loading={isProcessing}
              onPress={() => handleAccept(offer)}
            />
          </View>
        )}
      </Card>
    );
  };

  // Screen layout. The list below depends on the state: loading, empty, or has offers.
  return (
    <View style={styles.root}>
      <Screen withBottomNav>
        {/* Page title with a back button */}
        <ScreenHeader title="Offers" subtitle="Buyer offers on your listings" back />

        {/* Show a spinner, an empty message, or the two lists */}
        {loading ? (
          <LoadingState message="Loading offers…" />
        ) : offers.length === 0 ? (
          <EmptyState
            icon="pricetag-outline"
            title="No offers yet"
            message="When a buyer submits an offer on one of your listings it will appear here."
          />
        ) : (
          <>
            {pendingOffers.length > 0 && (
              <>
                {/* Pending offers (highest first) */}
                <SectionTitle meta={`${pendingOffers.length} pending`}>Pending offers</SectionTitle>
                {pendingOffers.map((o, i) => (
                  <OfferCard key={o.id} offer={o} highest={i === 0} />
                ))}
              </>
            )}
            {otherOffers.length > 0 && (
              <>
                {/* Offers that were already accepted or rejected */}
                <SectionTitle>Offer history</SectionTitle>
                {otherOffers.map(o => (
                  <OfferCard key={o.id} offer={o} highest={false} />
                ))}
              </>
            )}
          </>
        )}
      </Screen>
      {/* Bottom tab bar */}
      <BottomNav role="seller" active="orders" />
    </View>
  );
}

// Styles for the offer cards and the highlighted top offer.
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.background },
  card: { marginBottom: Space.md },
  topOfferCard: {
    borderWidth: 2,
    borderColor: Palette.brand[500],
  },
  topBadgeRow: { marginBottom: Space.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  typeIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: { flex: 1, textTransform: 'capitalize' },
  actionRow: { flexDirection: 'row', gap: Space.md, marginTop: Space.lg },
  actionBtn: { flex: 1 },
});
