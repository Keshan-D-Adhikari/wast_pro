import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { useRouter } from "expo-router";

const screenWidth = Dimensions.get("window").width;

export default function SellerDashboard() {
  const router = useRouter();

  const showAlert = () => {
    Alert.alert("Smart Bin Alert", "Plastic bin is almost full!");
  };

  const BinCard = ({ title, percent, kg, color }: any) => (
    <View style={[styles.binCard, { backgroundColor: color }]}>
      <Text style={styles.binTitle}>{title}</Text>
      <Text style={styles.percent}>{percent}%</Text>

      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>

      <Text style={styles.kg}>{kg} kg</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>

      {/* HEADER */}
      <Text style={styles.header}>Good morning, Nuwan 👋</Text>

      {/* BIN STATUS */}
      <View style={styles.row}>
        <BinCard title="Plastic" percent={84} kg="12.3" color="#4CAF50" />
        <BinCard title="Organic" percent={62} kg="8.1" color="#F4A261" />
        <BinCard title="Other" percent={23} kg="5.2" color="#9CA3AF" />
      </View>

      {/* MAP PLACEHOLDER */}
      <Text style={styles.section}>Smart Bin Location</Text>

      <View style={styles.mapBox}>
        <Text>📍 Map will appear here</Text>
      </View>

      {/* ANALYTICS */}
      <Text style={styles.section}>Waste Analytics</Text>

      <PieChart
        data={[
          {
            name: "Plastic",
            population: 40,
            color: "#4CAF50",
            legendFontColor: "#333",
            legendFontSize: 12,
          },
          {
            name: "Paper",
            population: 25,
            color: "#90BE6D",
            legendFontColor: "#333",
            legendFontSize: 12,
          },
          {
            name: "Glass",
            population: 20,
            color: "#F4A261",
            legendFontColor: "#333",
            legendFontSize: 12,
          },
          {
            name: "Metal",
            population: 15,
            color: "#9CA3AF",
            legendFontColor: "#333",
            legendFontSize: 12,
          },
        ]}
        width={screenWidth - 40}
        height={200}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="10"
        chartConfig={{
          color: () => "#000",
        }}
      />

      {/* BUYERS */}
      <Text style={styles.section}>Nearby Buyers</Text>

      <View style={styles.buyerCard}>
        <Text style={styles.buyerName}>Green Recycling</Text>
        <Text>Plastic - Rs 85/kg</Text>
        <Text>Distance: 2.3 km</Text>
      </View>

      <View style={styles.buyerCard}>
        <Text style={styles.buyerName}>Eco Waste Lanka</Text>
        <Text>Paper - Rs 60/kg</Text>
        <Text>Distance: 3.1 km</Text>
      </View>

      {/* ALERT */}
      <TouchableOpacity style={styles.alertBtn} onPress={showAlert}>
        <Text style={styles.alertText}>Check Bin Alerts</Text>
      </TouchableOpacity>

      {/* SELL WASTE */}
      <TouchableOpacity
        style={styles.sellBtn}
        onPress={() => router.push("/(tabs)/seller/AddWaste")}
      >
        <Text style={styles.sellText}>Sell Waste</Text>
      </TouchableOpacity>

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

  header: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  binCard: {
    width: "31%",
    borderRadius: 20,
    padding: 16,
  },

  binTitle: {
    fontSize: 14,
    color: "#fff",
  },

  percent: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
  },

  progressBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 10,
    marginTop: 10,
  },

  progressFill: {
    height: 6,
    backgroundColor: "#fff",
    borderRadius: 10,
  },

  kg: {
    marginTop: 6,
    fontSize: 12,
    color: "#fff",
  },

  section: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 20,
  },

  mapBox: {
    height: 180,
    backgroundColor: "#E5E7EB",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  buyerCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },

  buyerName: {
    fontWeight: "600",
  },

  alertBtn: {
    backgroundColor: "#F4A261",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
  },

  alertText: {
    color: "#fff",
    fontWeight: "600",
  },

  sellBtn: {
    backgroundColor: "#4F772D",
    padding: 18,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 15,
    marginBottom: 30,
  },

  sellText: {
    color: "#fff",
    fontWeight: "700",
  },
});