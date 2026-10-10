import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { Offer } from '../../../types';

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

export default function BuyerOffers() {
  const authUser = useAuthUser();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser) return;

    const q = query(
      collection(db, 'offers'),
      where('buyerUid', '==', authUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOffers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Offer)));
      setLoading(false);
    }, (err) => {
      console.error('BuyerOffers error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authUser]);

  const handleWithdraw = async (offer: Offer) => {
    setWithdrawingId(offer.id);
    try {
      await updateDoc(doc(db, 'offers', offer.id), {
        status: 'withdrawn',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Withdraw error:', err);
    } finally {
      setWithdrawingId(null);
    }
  };

  const OfferCard = ({ offer }: { offer: Offer }) => {
    const accent = wasteAccent(offer.wasteType as any);
    const date = offer.createdAt?.toDate ? offer.createdAt.toDate().toLocaleDateString() : 'Just now';

    return (
      <Card style={[styles.card, offer.status === 'accepted' && styles.acceptedCard]}>
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

        <DetailRow label="Seller" value={offer.sellerName} />
        <DetailRow label="Weight" value={`${offer.weightKg} kg`} />
        <DetailRow label="Asking price" value={`Rs ${offer.askingPrice}`} />
        <DetailRow label="Your offer" value={`Rs ${offer.offeredPrice}`} emphasis />
        <DetailRow label="Date" value={date} />

        {offer.status === 'accepted' && (
          <View style={styles.acceptedBanner}>
            <Ionicons name="checkmark-circle" size={16} color={Palette.status.success.base} />
            <Text style={[Type.caption, { color: Palette.status.success.base, fontWeight: '700' }]}>
              Offer accepted! Check My Purchases for the order.
            </Text>
          </View>
        )}

        {offer.status === 'pending' && (
          <Button
            label="Withdraw offer"
            variant="secondary"
            style={styles.withdrawBtn}
            loading={withdrawingId === offer.id}
            onPress={() => handleWithdraw(offer)}
          />
        )}
      </Card>
    );
  };

  return (
    <View style={styles.root}>
      <Screen withBottomNav>
        <ScreenHeader title="My offers" subtitle="Offers you submitted to sellers" back />

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
            <SectionTitle meta={`${offers.length} total`}>Your offers</SectionTitle>
            {offers.map(o => <OfferCard key={o.id} offer={o} />)}
          </>
        )}
      </Screen>
      <BottomNav role="buyer" active="orders" />
    </View>
  );
}

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
  withdrawBtn: { marginTop: Space.lg },
});
