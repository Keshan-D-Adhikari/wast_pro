import { View, Text, StyleSheet, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { db, auth } from '../../../firebaseConfig';
import { doc, getDoc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

import { Palette, Space, Radius, Shadow, Type, wasteAccent } from '@/constants/design';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Card, SectionTitle, Divider, DetailRow } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/badge';
import { TextField } from '@/components/ui/text-field';
import { BottomNav } from '@/components/ui/bottom-nav';

const priceConfig: any = {
  plastic: {
    pricePerKg: 45,
    icon: 'cube-outline',
    label: 'Plastic'
  },
  food: {
    pricePerKg: 20,
    icon: 'leaf-outline',
    label: 'Food'
  },
  metal: {
    pricePerKg: 120,
    icon: 'construct-outline',
    label: 'Metal'
  },
};

interface WasteItem {
  weight: string;
  total: number;
  selected: boolean;
}

// Each compartment in the "bins" document is stored nested, e.g.
// plastic: { level: 78, weight: 12.5 }  — level is % full, weight is kg available
interface BinCompartment {
  level?: number;
  weight?: number;
  moisture?: number;
}

export default function AddWaste() {
  const [loading, setLoading] = useState(false);
  const [binData, setBinData] = useState<any>(null);
  const [binExists, setBinExists] = useState<boolean | null>(null);
  const [sellerName, setSellerName] = useState('');
  const [sellerBinLocation, setSellerBinLocation] = useState<any>(null);

  const [wasteItems, setWasteItems] = useState<{ [key: string]: WasteItem }>({
    plastic: { weight: '', total: 0, selected: false },
    food:    { weight: '', total: 0, selected: false },
    metal:   { weight: '', total: 0, selected: false },
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser!.uid));
        if (userDoc.exists()) {
          setSellerName(userDoc.data().fullName);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUser();

    const binRef = doc(db, "bins", auth.currentUser.uid);
    const unsubscribe = onSnapshot(binRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBinData(data);
        setBinExists(true);
        if (data.location) {
          setSellerBinLocation(data.location);
        }
      } else {
        // No smart bin registered against this seller yet
        setBinData(null);
        setBinExists(false);
      }
    }, (error) => {
      console.error("Bin listener error:", error);
      setBinExists(false);
    });

    return () => unsubscribe();
  }, []);

  // Bin compartments are stored nested (plastic: { level, weight }),
  // so read through the compartment object instead of a flat field.
  const getCompartment = (type: string): BinCompartment =>
    (binData?.[type] as BinCompartment) || {};

  const availableKg = (type: string): number => getCompartment(type).weight ?? 0;
  const fillLevel = (type: string): number => getCompartment(type).level ?? 0;

  const handleWeightChange = (type: string, value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const price = priceConfig[type].pricePerKg;
    const total = parseFloat(cleaned) * price;

    setWasteItems((prev: any) => ({
      ...prev,
      [type]: {
        weight: cleaned,
        total: isNaN(total) ? 0 : total,
        selected: cleaned.length > 0
      }
    }));
  };

  const grandTotal = Object.values(wasteItems)
    .reduce((sum: number, item: any) => sum + item.total, 0);

  const selectedCount = Object.values(wasteItems)
    .filter((item: any) => item.selected).length;

  const handleSubmit = async () => {
    const selectedItems = Object.entries(wasteItems)
      .filter(([_, item]) =>
        item.selected && parseFloat(item.weight) > 0
      ) as [string, WasteItem][];

    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please enter weight for at least one waste type');
      return;
    }

    if (!binData) {
      Alert.alert(
        'No smart bin found',
        'No smart bin is registered against your account yet, so there is no measured waste to list.'
      );
      return;
    }

    // Validation check for all selected items against the weight
    // currently measured in each bin compartment
    for (const [type, item] of selectedItems) {
      const maxWeight = availableKg(type);
      if (parseFloat(item.weight) > maxWeight) {
        Alert.alert(
          'Error',
          `Capacity exceeded for ${priceConfig[type].label}. Available in bin: ${maxWeight} kg`
        );
        return;
      }
    }

    // Buyers need coordinates to show the pickup route, so refuse to
    // create a listing that would land in the marketplace without them.
    if (
      !sellerBinLocation ||
      typeof sellerBinLocation.latitude !== 'number' ||
      typeof sellerBinLocation.longitude !== 'number'
    ) {
      Alert.alert(
        'Bin location missing',
        'Your smart bin has no location set, so buyers would not be able to find it. Please contact support.'
      );
      return;
    }

    try {
      setLoading(true);

      // Normalise to a plain object — the bin document stores a Firestore
      // GeoPoint, but MarketplaceItem.location is { latitude, longitude }
      const listingLocation = {
        latitude: sellerBinLocation.latitude,
        longitude: sellerBinLocation.longitude,
      };

      for (const [type, item] of selectedItems) {
        await addDoc(collection(db, 'marketplace'), {
          sellerUid: auth.currentUser!.uid,
          sellerName: sellerName || "Unknown Seller",
          wasteType: type,
          weightKg: parseFloat(item.weight),
          pricePerKg: priceConfig[type].pricePerKg,
          totalPrice: item.total,
          status: 'available',
          location: listingLocation,
          createdAt: serverTimestamp()
        });
      }

      Alert.alert(
        'Listed Successfully!',
        selectedCount + ' waste type(s) added to marketplace.\n' +
        'Total value: Rs ' + grandTotal.toFixed(0)
      );

      // Reset all
      setWasteItems({
        plastic: { weight:'', total:0, selected:false },
        food:    { weight:'', total:0, selected:false },
        metal:   { weight:'', total:0, selected:false },
      });

    } catch (error: any) {
      Alert.alert('Error', 'Could not add listing: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Screen withBottomNav>
        <ScreenHeader
          title="Add to marketplace"
          subtitle="List waste measured in your smart bin"
          back
        />

        {binExists === false && (
          <Notice text="No smart bin is registered against your account yet, so there are no sensor readings to list from." />
        )}

        <SectionTitle tight meta={selectedCount > 0 ? `${selectedCount} selected` : undefined}>
          Waste types
        </SectionTitle>

        {Object.entries(priceConfig).map(([type, config]: [string, any]) => {
          const item = wasteItems[type];
          const accent = wasteAccent(type);
          const exceeds = item.weight !== '' && binData && parseFloat(item.weight) > availableKg(type);

          return (
            <Card
              key={type}
              style={[
                styles.wasteCard,
                item.selected && { borderColor: accent.base, backgroundColor: accent.tint },
              ]}
            >
              {/* Card Header */}
              <View style={styles.wasteHeader}>
                <View style={[styles.wasteIcon, { backgroundColor: accent.base }]}>
                  <Ionicons name={config.icon} size={19} color={Palette.white} />
                </View>
                <View style={styles.wasteTitleBlock}>
                  <Text style={Type.bodyStrong}>{config.label} waste</Text>
                  <Text style={Type.caption}>Rs {config.pricePerKg} per kg</Text>
                </View>
                {item.selected && (
                  <View style={[styles.wastePrice, { backgroundColor: accent.base }]}>
                    <Text style={styles.wastePriceText}>Rs {item.total.toFixed(0)}</Text>
                  </View>
                )}
              </View>

              {/* Weight Input */}
              <TextField
                placeholder="Enter weight"
                value={item.weight}
                onChangeText={(text) => handleWeightChange(type, text)}
                keyboardType="decimal-pad"
                suffix="kg"
                containerStyle={styles.wasteInput}
                error={exceeds ? `Exceeds bin capacity — available: ${availableKg(type)} kg` : undefined}
              />

              {/* Show bin availability */}
              {binData && (
                <View style={styles.availabilityRow}>
                  <View style={styles.availabilityTrack}>
                    <View
                      style={[
                        styles.availabilityFill,
                        { width: `${Math.min(fillLevel(type), 100)}%`, backgroundColor: accent.base },
                      ]}
                    />
                  </View>
                  <Text style={Type.caption}>
                    {availableKg(type)} kg available · {fillLevel(type)}% full
                  </Text>
                </View>
              )}
            </Card>
          );
        })}

        {/* TOTAL SUMMARY CARD */}
        {grandTotal > 0 && (
          <>
            <SectionTitle>Order summary</SectionTitle>
            <Card tone="brand" elevation={0}>
              {Object.entries(wasteItems).map(([type, item]: [string, any]) =>
                item.selected ? (
                  <DetailRow
                    key={type}
                    label={`${priceConfig[type].label} · ${item.weight} kg × Rs ${priceConfig[type].pricePerKg}`}
                    value={`Rs ${item.total.toFixed(0)}`}
                  />
                ) : null
              )}
              <Divider />
              <DetailRow label="Grand total" value={`Rs ${grandTotal.toFixed(0)}`} emphasis />
            </Card>
          </>
        )}

        <Button
          label="Post to marketplace"
          icon="storefront-outline"
          onPress={handleSubmit}
          loading={loading}
          disabled={grandTotal === 0 || !binData}
          style={styles.submitBtn}
        />
      </Screen>

      <BottomNav role="seller" active="market" />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.background },

  wasteCard: {
    marginBottom: Space.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  wasteHeader: { flexDirection: 'row', alignItems: 'center', gap: Space.md, marginBottom: Space.lg },
  wasteIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wasteTitleBlock: { flex: 1, gap: 2 },
  wastePrice: {
    paddingHorizontal: Space.md,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    ...Shadow[1],
  },
  wastePriceText: { ...Type.caption, color: Palette.white, fontWeight: '800' },
  wasteInput: { marginBottom: Space.sm },

  availabilityRow: { gap: Space.sm },
  availabilityTrack: {
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: Palette.ink[100],
    overflow: 'hidden',
  },
  availabilityFill: { height: 4, borderRadius: Radius.pill },

  submitBtn: { marginTop: Space['2xl'] },
});
