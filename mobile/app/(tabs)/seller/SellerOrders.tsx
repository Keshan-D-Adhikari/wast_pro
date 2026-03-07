import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function SellerOrders() {
  const router = useRouter();

  const OrderCard = ({ type, buyer, status, date, price, weight }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.typeRow}>
          <Ionicons name="leaf" size={20} color="#4F772D" />
          <Text style={styles.type}>{type}</Text>
        </View>
        <View style={[styles.badge, status === 'Completed' ? styles.badgeSuccess : styles.badgePending]}>
          <Text style={[styles.badgeText, status === 'Completed' ? styles.textSuccess : styles.textPending]}>
            {status}
          </Text>
        </View>
      </View>
      
      <View style={styles.detailsRow}>
        <Text style={styles.detailText}>Buyer: <Text style={styles.bold}>{buyer}</Text></Text>
        <Text style={styles.detailText}>Date: {date}</Text>
      </View>

      <View style={styles.detailsRow}>
        <Text style={styles.detailText}>Weight: {weight} kg</Text>
        <Text style={styles.priceText}>Total: Rs {price}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My Orders</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="filter" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent Transactions</Text>

      <OrderCard 
        type="Plastic Waste" 
        buyer="Green Recycling" 
        status="Pending" 
        date="Oct 24, 2025" 
        weight="12.5" 
        price="1060" 
      />
      
      <OrderCard 
        type="Paper Waste" 
        buyer="Eco Lanka" 
        status="Completed" 
        date="Oct 20, 2025" 
        weight="8.0" 
        price="480" 
      />

      <OrderCard 
        type="Glass Waste" 
        buyer="GlassCo" 
        status="Completed" 
        date="Oct 15, 2025" 
        weight="15.0" 
        price="1050" 
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F9F4",
    padding: 20,
    paddingTop: 60,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111827",
  },
  filterBtn: {
    backgroundColor: "#4F772D",
    padding: 10,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 10,
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  type: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginLeft: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePending: { backgroundColor: "#FEF3C7" },
  badgeSuccess: { backgroundColor: "#D1FAE5" },
  badgeText: { fontSize: 12, fontWeight: "bold" },
  textPending: { color: "#D97706" },
  textSuccess: { color: "#059669" },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#4B5563",
  },
  bold: {
    fontWeight: "600",
    color: "#111827",
  },
  priceText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#4F772D",
  }
});