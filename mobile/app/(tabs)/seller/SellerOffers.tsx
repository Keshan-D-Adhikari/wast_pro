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
import { Offer, Order } from '../../../types';

import { Palette, Space, Radius, Type, wasteAccent } from '@/constants/design';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Card, SectionTitle, Divider, DetailRow } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState, LoadingState } from '@/components/ui/empty-state';
import { BottomNav } from '@/components/ui/bottom-nav';

const offerStatusTone = (s: Offer['status']): 'success' | 'warning' | 'danger' | 'neutral' => {
  if (s === 'accepted') return 'success';
  if (s === 'pending') return 'warning';
  if (s === 'rejected') return 'danger';
  return 'neutral';
};

export default function SellerOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'offers'),
      where('sellerUid', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Offer))
        // Sort: pending first, then by offeredPrice descending so the highest offer is at the top
        .sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          return b.offeredPrice - a.offeredPrice;
        });
      setOffers(list);
      setLoading(false);
    }, (err) => {
      console.error('SellerOffers error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAccept = (offer: Offer) => {
    Alert.alert(
      'Accept offer?',
      `Accept Rs ${offer.offeredPrice} from ${offer.buyerName} for ${offer.wasteType} waste?\n\nThis will create a confirmed order at the offered price and reject all other pending offers for this listing.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            if (!auth.currentUser) return;
            setProcessingId(offer.id);
            try {
              // Use a transaction to atomically: mark offer accepted, mark listing sold, create order
              const orderRef = doc(collection(db, 'orders'));
              await runTransaction(db, async (tx) => {
                const listingRef = doc(db, 'marketplace', offer.listingId);
                const listingSnap = await tx.get(listingRef);

                if (!listingSnap.exists()) throw new Error('Listing no longer exists.');
                if (listingSnap.data().status !== 'available') throw new Error('This listing is no longer available.');

                const offerRef = doc(db, 'offers', offer.id);
                const offerSnap = await tx.get(offerRef);
                if (!offerSnap.exists() || offerSnap.data().status !== 'pending') {
                  throw new Error('This offer is no longer pending.');
                }

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
                  paymentMethod: 'cash',          // buyer will choose payment after acceptance
                  paymentStatus: 'pending',
                  paymentLast4: null,
                  status: 'confirmed',
                  location: listing.location,
                  createdAt: serverTimestamp() as any,
                  cancelledAt: null,
                };

                // Mark offer accepted
                tx.update(offerRef, { status: 'accepted', updatedAt: serverTimestamp() });
                // Mark listing sold
                tx.update(listingRef, { status: 'sold' });
                // Create order
                tx.set(orderRef, orderData);
              });

              // Reject all other pending offers for the same listing (outside the transaction is fine;
              // the listing is now 'sold' so no new offers can be placed)
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

              // Notify accepted buyer
              await addDoc(collection(db, 'notifications'), {
                toUid: offer.buyerUid,
                type: 'offer_accepted',
                message: `Your offer of Rs ${offer.offeredPrice} for ${offer.wasteType} waste has been accepted! An order has been created.`,
                read: false,
                createdAt: serverTimestamp(),
                offerId: offer.id,
              });

              Alert.alert('Offer accepted', `Order created for Rs ${offer.offeredPrice}. Buyer has been notified.`);
            } catch (err: unknown) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Could not accept offer. Please try again.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

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

  const pendingOffers = offers.filter(o => o.status === 'pending');
  const otherOffers = offers.filter(o => o.status !== 'pending');

  const OfferCard = ({ offer, highest }: { offer: Offer; highest: boolean }) => {
    const accent = wasteAccent(offer.wasteType as any);
    const isPending = offer.status === 'pending';
    const isProcessing = processingId === offer.id;
    const date = offer.createdAt?.toDate ? offer.createdAt.toDate().toLocaleDateString() : 'Just now';

    return (
      <Card style={[styles.card, highest && isPending && styles.topOfferCard]}>
        {highest && isPending && (
          <View style={styles.topBadgeRow}>
            <Badge label="Highest offer" tone="success" icon="trending-up-outline" />
          </View>
        )}
        <View style={styles.cardHeader}>
          <View style={[styles.typeIcon, { backgroundColor: accent.tint }]}>
            <Ionicons name="cube-outline" size={17} color={accent.base} />
          </View>
          <Text style={[Type.bodyStrong, styles.typeText]} numberOfLines={1}>
            {offer.wasteType} waste · {offer.weightKg} kg
          </Text>
          <Badge label={offer.status} tone={offerStatusTone(offer.status)} />
        </View>

        <Divider />

        <DetailRow label="Buyer" value={offer.buyerName} />
        <DetailRow label="Asking price" value={`Rs ${offer.askingPrice}`} />
        <DetailRow label="Offered price" value={`Rs ${offer.offeredPrice}`} emphasis />
        <DetailRow label="Date" value={date} />

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

  return (
    <View style={styles.root}>
      <Screen withBottomNav>
        <ScreenHeader title="Offers" subtitle="Buyer offers on your listings" back />

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
                <SectionTitle meta={`${pendingOffers.length} pending`}>Pending offers</SectionTitle>
                {pendingOffers.map((o, i) => (
                  <OfferCard key={o.id} offer={o} highest={i === 0} />
                ))}
              </>
            )}
            {otherOffers.length > 0 && (
              <>
                <SectionTitle>Offer history</SectionTitle>
                {otherOffers.map(o => (
                  <OfferCard key={o.id} offer={o} highest={false} />
                ))}
              </>
            )}
          </>
        )}
      </Screen>
      <BottomNav role="seller" active="orders" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.background },
  card: { marginBottom: Space.md },
  topOfferCard: {
    borderWidth: 2,
    borderColor: Palette.brand[400],
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
