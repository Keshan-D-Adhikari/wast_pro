import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { db, auth } from '../../../firebaseConfig';
import { doc, getDoc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const priceConfig: any = {
  plastic: { 
    pricePerKg: 45,  
    icon: 'cube-outline',    
    color: '#2196F3', 
    bgColor: '#E3F2FD',
    label: 'Plastic' 
  },
  food: { 
    pricePerKg: 20,  
    icon: 'leaf-outline',    
    color: '#FF9800', 
    bgColor: '#FFF3E0',
    label: 'Food' 
  },
  metal: { 
    pricePerKg: 120, 
    icon: 'construct-outline', 
    color: '#607D8B', 
    bgColor: '#ECEFF1',
    label: 'Metal' 
  },
};

interface WasteItem {
  weight: string;
  total: number;
  selected: boolean;
}

export default function AddWaste() {
  const [loading, setLoading] = useState(false);
  const [binData, setBinData] = useState<any>(null);
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
        if (data.location) {
          setSellerBinLocation(data.location);
        }
      }
    });
    
    return () => unsubscribe();
  }, []);

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

    // Validation check for all selected items against bin capacity
    for (const [type, item] of selectedItems) {
      const maxWeight = binData?.[type + 'Weight'] || 0;
      if (parseFloat(item.weight) > maxWeight) {
        Alert.alert('Error', `Capacity exceeded for ${type}. Max: ${maxWeight} kg`);
        return;
      }
    }

    try {
      setLoading(true);

      for (const [type, item] of selectedItems) {
        await addDoc(collection(db, 'marketplace'), {
          sellerUid: auth.currentUser!.uid,
          sellerName: sellerName || "Unknown Seller",
          wasteType: type,
          weightKg: parseFloat(item.weight),
          pricePerKg: priceConfig[type].pricePerKg,
          totalPrice: item.total,
          status: 'available',
          location: sellerBinLocation,
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>Add to Marketplace</Text>
      
      <View style={styles.cardsContainer}>
        {Object.entries(priceConfig).map(([type, config]: [string, any]) => (
          <View
            key={type}
            style={{
              backgroundColor: wasteItems[type].selected ? config.bgColor : 'white',
              borderRadius: 14,
              borderWidth: wasteItems[type].selected ? 2 : 1,
              borderColor: wasteItems[type].selected ? config.color : '#ddd',
              padding: 16,
              marginBottom: 12,
              elevation: wasteItems[type].selected ? 4 : 1,
              shadowColor: config.color,
              shadowOpacity: 0.1,
              shadowRadius: 5
            }}
          >
            {/* Card Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 42, height: 42,
                borderRadius: 21,
                backgroundColor: config.color + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <Ionicons name={config.icon} size={22} color={config.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#333' }}>
                  {config.label} Waste
                </Text>
                <Text style={{ fontSize: 12, color: '#888' }}>
                  Rs {config.pricePerKg} per kg
                </Text>
              </View>
              {wasteItems[type].selected && (
                <View style={{
                  backgroundColor: config.color,
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 4
                }}>
                  <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>
                    Rs {wasteItems[type].total.toFixed(0)}
                  </Text>
                </View>
              )}
            </View>

            {/* Weight Input */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: wasteItems[type].selected ? config.color : '#ddd',
                borderRadius: 10,
                backgroundColor: 'white',
                paddingHorizontal: 14,
                height: 48
              }}>
                <TextInput
                  placeholder="Enter weight"
                  placeholderTextColor="#bbb"
                  value={wasteItems[type].weight}
                  onChangeText={(text) => handleWeightChange(type, text)}
                  keyboardType="decimal-pad"
                  style={{ flex: 1, fontSize: 15, color: '#333' }}
                />
                <Text style={{ color: '#888', fontSize: 13, fontWeight: '600' }}>kg</Text>
              </View>
            </View>

            {/* Show bin availability */}
            {binData && (
              <Text style={{ fontSize: 11, color: '#888', marginTop: 8 }}>
                Available in bin: {' '}
                <Text style={{ fontWeight: '600', color: '#555' }}>
                  {binData[type + 'Weight'] || 0} kg 
                </Text>
                {' '} ({binData[type] || 0}% full)
              </Text>
            )}

            {/* Warning if exceeds bin weight */}
            {wasteItems[type].weight && 
             binData && 
             parseFloat(wasteItems[type].weight) > (binData[type + 'Weight'] || 0) && (
              <Text style={{ fontSize: 11, color: '#F44336', marginTop: 4, fontWeight: '600' }}>
                Exceeds bin capacity! Max: {binData[type + 'Weight'] || 0} kg
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* TOTAL SUMMARY CARD */}
      {grandTotal > 0 && (
        <View style={styles.grandSummaryCard}>
          <Text style={styles.grandSummaryTitle}>Order Summary</Text>

          {Object.entries(wasteItems).map(([type, item]: [string, any]) => 
            item.selected ? (
              <View key={type} style={styles.summaryItemRow}>
                <Text style={styles.summaryItemLabel}>
                  {type} ({item.weight} kg × Rs {priceConfig[type].pricePerKg})
                </Text>
                <Text style={styles.summaryItemValue}>
                  Rs {item.total.toFixed(0)}
                </Text>
              </View>
            ) : null
          )}

          <View style={styles.summaryDivider}/>

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>Rs {grandTotal.toFixed(0)}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.btn, (loading || grandTotal === 0) && { opacity: 0.7 }]} 
        onPress={handleSubmit} 
        disabled={loading || grandTotal === 0}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Post to Marketplace</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9F4', padding: 20, paddingTop: 60 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 25, color: '#1B4332' },
  cardsContainer: { marginBottom: 10 },
  grandSummaryCard: { backgroundColor: '#E8F5E9', borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1.5, borderColor: '#4F772D' },
  grandSummaryTitle: { fontSize: 15, fontWeight: '700', color: '#2E7D32', marginBottom: 12 },
  summaryItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryItemLabel: { color: '#555', fontSize: 13, textTransform: 'capitalize' },
  summaryItemValue: { color: '#333', fontSize: 13, fontWeight: '600' },
  summaryDivider: { height: 1, backgroundColor: '#A5D6A7', marginVertical: 10 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  grandTotalLabel: { fontSize: 16, fontWeight: '700', color: '#2E7D32' },
  grandTotalValue: { fontSize: 16, fontWeight: '700', color: '#2E7D32' },
  btn: { backgroundColor: '#4F772D', padding: 16, borderRadius: 30, alignItems: 'center', marginTop: 10, elevation: 2 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
