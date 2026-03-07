import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function EditProfile() {
  const router = useRouter();

  const [name, setName] = useState("Keshan D Adhikari");
  const [email, setEmail] = useState("keshan@email.com");
  const [phone, setPhone] = useState("+94 77 123 4567");
  const [location, setLocation] = useState("Colombo, Sri Lanka");

  const handleSave = () => {
    Alert.alert("Success", "Your profile details have been updated! ✅");
    router.back();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>K</Text>
        </View>
        <TouchableOpacity style={styles.cameraBadge}>
          <Ionicons name="camera" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#4F772D" style={styles.icon} />
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
        </View>

        <Text style={styles.label}>Email Address</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#4F772D" style={styles.icon} />
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
        </View>

        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} color="#4F772D" style={styles.icon} />
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <Text style={styles.label}>Location / Address</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="location-outline" size={20} color="#4F772D" style={styles.icon} />
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F9F4", padding: 20, paddingTop: 50 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 30 },
  backBtn: { padding: 8, backgroundColor: "#fff", borderRadius: 12, elevation: 2, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#111827" },
  spacer: { width: 40 },
  avatarContainer: { alignItems: "center", marginBottom: 30, position: "relative" },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "#4F772D" },
  avatarText: { fontSize: 40, fontWeight: "bold", color: "#4F772D" },
  cameraBadge: { position: "absolute", bottom: 0, right: "35%", backgroundColor: "#4F772D", width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "#F5F9F4" },
  formCard: { backgroundColor: "#fff", padding: 20, borderRadius: 24, elevation: 3, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8, marginTop: 10 },
  inputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, backgroundColor: "#F9FAFB", paddingHorizontal: 12 },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: "#111827" },
  saveBtn: { backgroundColor: "#4F772D", padding: 16, borderRadius: 30, alignItems: "center", marginTop: 30, shadowColor: "#4F772D", shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  bottomSpacer: { height: 40 }
});