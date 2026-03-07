import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function BuyerDashboard() {
  const router = useRouter();
  
  // Route A state was created to show and hide it.
  const [showRoute, setShowRoute] = useState(false);

  // Map coordinates for the shortest route (Coordinates)
  const routeCoordinates = [
    { latitude: 6.9200, longitude: 79.8650 }, // Truck starting point
    { latitude: 6.9271, longitude: 79.8612 }, // Keshan's location
    { latitude: 6.9300, longitude: 79.8500 }, // Smart Bin 01
  ];

  const handleOptimizeRoute = () => {
    setShowRoute(!showRoute);
    if (!showRoute) {
      Alert.alert(
        "Route Optimized! 🚚", 
        "Calculated the shortest path to collect available waste. You will save approximately 1.5 liters of fuel."
      );
    }
  };

  const WasteCard = ({ type, weight, price, distance }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.wasteType}>{type}</Text>
        <Text style={styles.distance}>📍 {distance} km</Text>
      </View>
      
      <Text style={styles.detailText}>Weight: {weight} kg</Text>
      <Text style={styles.detailText}>Price: Rs {price}/kg</Text>

      <TouchableOpacity
        style={styles.buyBtn}
        onPress={() => alert("Purchase request sent to the seller!")}
      >
        <Text style={styles.buyText}>Buy Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F9F4" }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Buyer Dashboard</Text>
        <Text style={styles.sub}>Find recyclable waste near you</Text>

        <TextInput
          placeholder="Search waste (Plastic, Paper...)"
          style={styles.search}
        />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Available Waste Locations</Text>
        </View>
        
        <View style={styles.mapBox}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 6.9250,
              longitude: 79.8580,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }}
          >
            {/* Markers */}
            <Marker 
              coordinate={{ latitude: 6.9271, longitude: 79.8612 }} 
              title="Keshan (Seller)" 
              description="12kg Plastic - Rs 85/kg"
              pinColor="#4CAF50"
            />
            <Marker 
              coordinate={{ latitude: 6.9300, longitude: 79.8500 }} 
              title="Smart Bin 01" 
              description="8kg Paper - Rs 60/kg"
              pinColor="#F4A261"
            />
            <Marker 
              coordinate={{ latitude: 6.9200, longitude: 79.8650 }} 
              title="Your Truck" 
              description="Starting Point"
              pinColor="#3B82F6"
            />

            {/* ⬅️ shortast path  */}
            {showRoute && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#3B82F6" // blue color for the route
                strokeWidth={4}
                geodesic={true}
              />
            )}
          </MapView>
        </View>

        
        <TouchableOpacity 
          style={[styles.routeBtn, showRoute && styles.routeBtnActive]} 
          onPress={handleOptimizeRoute}
        >
          <Ionicons name="map-outline" size={20} color={showRoute ? "#4F772D" : "#fff"} />
          <Text style={[styles.routeBtnText, showRoute && styles.routeBtnTextActive]}>
            {showRoute ? "Clear Optimized Route" : "Optimize Collection Route"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Recent Listings</Text>

        <WasteCard type="Plastic Waste" weight="12" price="85" distance="2.3" />
        <WasteCard type="Paper Waste" weight="8" price="60" distance="3.1" />
        <WasteCard type="Glass Waste" weight="5" price="70" distance="4.5" />

        <View style={{ height: 30 }} />
      </ScrollView>

      
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#4F772D" />
          <Text style={[styles.navText, { color: "#4F772D" }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => alert("Search Feature Coming Soon!")}>
          <Ionicons name="search-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => alert("Orders Feature Coming Soon!")}>
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
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { fontSize: 26, fontWeight: "700", color: "#111827" },
  sub: { color: "#6B7280", marginBottom: 20, fontSize: 14 },
  search: { borderWidth: 1, borderColor: "#D1D5DB", backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 20, fontSize: 15 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#374151", marginTop: 10, marginBottom: 12 },
  
  mapBox: { height: 220, borderRadius: 20, overflow: "hidden", marginBottom: 15, borderWidth: 1, borderColor: "#E5E7EB" },
  map: { width: "100%", height: "100%" },
  
  routeBtn: { backgroundColor: "#3B82F6", flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 14, borderRadius: 12, marginBottom: 20, elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5 },
  routeBtnActive: { backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#4F772D", elevation: 0 },
  routeBtnText: { color: "#fff", fontSize: 15, fontWeight: "bold", marginLeft: 8 },
  routeBtnTextActive: { color: "#4F772D" },

  card: { backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 14, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  wasteType: { fontSize: 16, fontWeight: "700", color: "#111827" },
  distance: { fontSize: 13, color: "#4F772D", fontWeight: "600" },
  detailText: { fontSize: 14, color: "#4B5563", marginBottom: 4 },
  buyBtn: { backgroundColor: "#4F772D", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginTop: 12 },
  buyText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  
  bottomBar: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#FFFFFF", paddingVertical: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: "#E5E7EB", elevation: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
  navItem: { alignItems: "center", justifyContent: "center", width: 60 },
  navText: { fontSize: 12, color: "#9CA3AF", marginTop: 4, fontWeight: "500" },
});