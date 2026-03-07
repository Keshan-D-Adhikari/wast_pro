import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal, // ⬅️ Modal එක import කළා
  TextInput,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { useRouter } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

const screenWidth = Dimensions.get("window").width;

export default function SellerDashboard() {
  const router = useRouter();

  // ⬅️ Modal එක පෙන්වන්න/හංගන්න State එක
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [issueDescription, setIssueDescription] = useState("");

  const showAlert = () => {
    Alert.alert("Smart Bin Alert", "Plastic bin is almost full!");
  };

  const handleReportSubmit = () => {
    if (issueDescription.trim() === "") {
      Alert.alert("Error", "Please enter the issue details.");
      return;
    }
    Alert.alert("Issue Reported", "Your report has been sent to the maintenance team.");
    setReportModalVisible(false);
    setIssueDescription("");
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
    <View style={{ flex: 1, backgroundColor: "#F5F9F4" }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* HEADER & REWARDS */}
        <View style={styles.headerRow}>
          <Text style={styles.header}>Good morning, Keshan D Adhikari 👋</Text>
          <View style={styles.rewardBadge}>
            <Text style={styles.rewardText}>🏆 450 Pts</Text>
          </View>
        </View>

        {/* BIN STATUS */}
        <View style={styles.row}>
          <BinCard title="Plastic" percent={84} kg="12.3" color="#4CAF50" />
          <BinCard title="Organic" percent={62} kg="8.1" color="#F4A261" />
          <BinCard title="Other" percent={23} kg="5.2" color="#9CA3AF" />
        </View>

        {/* MAP SECTION */}
        <Text style={styles.section}>Smart Bin Location</Text>

        <View style={styles.mapBox}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 6.9271, 
              longitude: 79.8612, 
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker 
              coordinate={{ latitude: 6.9271, longitude: 79.8612 }} 
              title="My Smart Bin" 
              description="84% Full - Plastic"
              pinColor="#4CAF50"
            />
          </MapView>
        </View>

        {/* ANALYTICS */}
        <Text style={styles.section}>Waste Analytics</Text>

        <PieChart
          data={[
            { name: "Plastic", population: 40, color: "#4CAF50", legendFontColor: "#333", legendFontSize: 12 },
            { name: "Paper", population: 25, color: "#90BE6D", legendFontColor: "#333", legendFontSize: 12 },
            { name: "Glass", population: 20, color: "#F4A261", legendFontColor: "#333", legendFontSize: 12 },
            { name: "Metal", population: 15, color: "#9CA3AF", legendFontColor: "#333", legendFontSize: 12 },
          ]}
          width={screenWidth - 40}
          height={200}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="10"
          chartConfig={{ color: () => "#000" }}
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

        {/* ALERT BUTTON */}
        <TouchableOpacity style={styles.alertBtn} onPress={showAlert}>
          <Text style={styles.alertText}>Check Bin Alerts</Text>
        </TouchableOpacity>

        {/* ⬅️ REPORT ISSUE BUTTON */}
        <TouchableOpacity 
          style={styles.reportBtn} 
          onPress={() => setReportModalVisible(true)}
        >
          <Ionicons name="warning-outline" size={20} color="#EF4444" />
          <Text style={styles.reportText}>Report an Issue with Bin</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ⬅️ REPORT ISSUE MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report an Issue</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSub}>Describe the problem with your Smart Bin (e.g., Sensor broken, Bad odor, Overflowing).</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter issue details..."
              multiline={true}
              numberOfLines={4}
              value={issueDescription}
              onChangeText={setIssueDescription}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleReportSubmit}>
              <Text style={styles.submitBtnText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CUSTOM BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#4F772D" />
          <Text style={[styles.navText, { color: "#4F772D" }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => router.push("/(tabs)/seller/AddWaste" as any)}
        >
          <Ionicons name="add-circle-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Add</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => router.push("/(tabs)/seller/SellerOrders" as any)}
        >
          <Ionicons name="list-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => router.push("/(tabs)/seller/SellerProfile" as any)}
        >
          <Ionicons name="person-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  header: { fontSize: 20, fontWeight: "700", flex: 1, marginRight: 10 },
  rewardBadge: { backgroundColor: "#FFD700", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexShrink: 0 },
  rewardText: { fontWeight: "bold", color: "#333" },
  
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  binCard: { width: "31%", borderRadius: 20, padding: 16 },
  binTitle: { fontSize: 14, color: "#fff" },
  percent: { fontSize: 26, fontWeight: "700", color: "#fff" },
  progressBg: { height: 6, backgroundColor: "rgba(255,255,255,0.4)", borderRadius: 10, marginTop: 10 },
  progressFill: { height: 6, backgroundColor: "#fff", borderRadius: 10 },
  kg: { marginTop: 6, fontSize: 12, color: "#fff" },
  
  section: { fontSize: 18, fontWeight: "600", marginBottom: 10, marginTop: 20 },
  mapBox: { height: 200, borderRadius: 20, overflow: "hidden", marginBottom: 10 },
  map: { width: "100%", height: "100%" },
  
  buyerCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginTop: 10 },
  buyerName: { fontWeight: "600" },
  
  alertBtn: { backgroundColor: "#F4A261", padding: 16, borderRadius: 30, alignItems: "center", marginTop: 20 },
  alertText: { color: "#fff", fontWeight: "600" },

  /* ⬅️ Report Issue Button Styles */
  reportBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#FEE2E2", padding: 16, borderRadius: 30, marginTop: 15, marginBottom: 20, borderWidth: 1, borderColor: "#FCA5A5" },
  reportText: { color: "#EF4444", fontWeight: "700", marginLeft: 8 },

  /* ⬅️ Modal Styles */
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalView: { width: "85%", backgroundColor: "white", borderRadius: 24, padding: 20, elevation: 10, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 10 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  modalSub: { fontSize: 13, color: "#6B7280", marginBottom: 15 },
  modalInput: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 12, padding: 12, fontSize: 15, backgroundColor: "#F9FAFB", height: 100 },
  submitBtn: { backgroundColor: "#EF4444", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 20 },
  submitBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },

  bottomBar: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#FFFFFF", paddingVertical: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: "#E5E7EB", elevation: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
  navItem: { alignItems: "center", justifyContent: "center", width: 60 },
  navText: { fontSize: 12, color: "#9CA3AF", marginTop: 4, fontWeight: "500" },
});