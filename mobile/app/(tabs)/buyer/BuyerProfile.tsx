import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function BuyerProfile() {
  const router = useRouter();

  const handleLogout = () => {
    router.replace("/(tabs)/Welcome" as any);
  };

  // ⬅️ onPress එක එකතු කළා
  const ProfileOption = ({ icon, title, color = "#4B5563", onPress }: any) => (
    <TouchableOpacity style={styles.optionBtn} onPress={onPress}>
      <View style={styles.optionLeft}>
        <Ionicons name={icon} size={22} color={color} />
        <Text style={[styles.optionText, { color }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buyer Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>G</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>Green Recycling</Text>
          <Text style={styles.email}>contact@greenrecycle.lk</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#4F772D" />
            <Text style={styles.location}>Colombo, Sri Lanka</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.dashboardBtn} 
        onPress={() => router.push("/(tabs)/buyer/BuyerDashboard" as any)}
      >
        <Ionicons name="grid-outline" size={22} color="#fff" />
        <Text style={styles.dashboardBtnText}>Go to Dashboard</Text>
      </TouchableOpacity>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>150</Text>
          <Text style={styles.statLabel}>Purchases</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>1.2t</Text>
          <Text style={styles.statLabel}>Waste Bought</Text>
        </View>
      </View>

      <View style={styles.optionsContainer}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        
        {/* ⬅️ Buyer ගේ Edit Profile බටන් එක ලින්ක් කළා */}
        <ProfileOption 
          icon="person-outline" 
          title="Edit Profile" 
          onPress={() => router.push("/(tabs)/buyer/EditProfile" as any)}
        />
        
        <ProfileOption icon="notifications-outline" title="Notifications" />
        <ProfileOption icon="shield-checkmark-outline" title="Privacy & Security" />
        
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F9F4" },
  header: { padding: 20, paddingTop: 60, backgroundColor: "#4F772D", borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 20 },
  profileCard: { backgroundColor: "#fff", marginHorizontal: 20, marginTop: -30, borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "center", elevation: 5, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center", marginRight: 15 },
  avatarText: { fontSize: 28, fontWeight: "bold", color: "#4F772D" },
  info: { flex: 1 },
  name: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  email: { fontSize: 14, color: "#6B7280", marginBottom: 4 },
  locationRow: { flexDirection: "row", alignItems: "center" },
  location: { fontSize: 13, color: "#4F772D", marginLeft: 4 },
  dashboardBtn: { backgroundColor: "#4F772D", flexDirection: "row", alignItems: "center", justifyContent: "center", marginHorizontal: 20, marginTop: 20, padding: 16, borderRadius: 15, elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5 },
  dashboardBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold", marginLeft: 10 },
  statsContainer: { flexDirection: "row", justifyContent: "space-between", marginHorizontal: 20, marginTop: 20 },
  statBox: { backgroundColor: "#fff", width: "48%", padding: 15, borderRadius: 15, alignItems: "center", elevation: 2 },
  statNumber: { fontSize: 24, fontWeight: "bold", color: "#4F772D" },
  statLabel: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  optionsContainer: { marginTop: 30, marginHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#374151", marginBottom: 15 },
  optionBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 15, marginBottom: 10 },
  optionLeft: { flexDirection: "row", alignItems: "center" },
  optionText: { fontSize: 16, fontWeight: "500", marginLeft: 15 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FEE2E2", padding: 16, borderRadius: 15, marginTop: 20 },
  logoutText: { fontSize: 16, fontWeight: "bold", color: "#EF4444", marginLeft: 10 }
});