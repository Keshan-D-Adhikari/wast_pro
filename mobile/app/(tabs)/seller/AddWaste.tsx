import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView 
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function AddWaste() {
  const router = useRouter();

  const [wasteType, setWasteType] = useState("");
  const [weight, setWeight] = useState("");
  const [price, setPrice] = useState("");

  return (
    <ScrollView style={styles.container}>
      
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sell Your Waste</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.subtitle}>
        Enter the details of the recyclable waste you want to sell.
      </Text>

      <View style={styles.formCard}>
        
        <Text style={styles.label}>Waste Type</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="leaf-outline" size={20} color="#4F772D" style={styles.icon} />
          <TextInput
            placeholder="e.g. Plastic, Paper, Glass"
            style={styles.input}
            value={wasteType}
            onChangeText={setWasteType}
          />
        </View>

        <Text style={styles.label}>Estimated Weight (kg)</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="scale-outline" size={20} color="#4F772D" style={styles.icon} />
          <TextInput
            placeholder="e.g. 12.5"
            keyboardType="numeric"
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
          />
        </View>

        <Text style={styles.label}>Expected Price per kg (Rs)</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="pricetag-outline" size={20} color="#4F772D" style={styles.icon} />
          <TextInput
            placeholder="e.g. 85"
            keyboardType="numeric"
            style={styles.input}
            value={price}
            onChangeText={setPrice}
          />
        </View>

        <Text style={styles.label}>Add a Photo (Optional)</Text>
        <TouchableOpacity style={styles.uploadBox}>
          <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
          <Text style={styles.uploadText}>Tap to upload image</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.btn}
          onPress={() => {
            alert("Waste listed successfully!");
            router.back();
          }}
        >
          <Text style={styles.btnText}>Post Waste to Market</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F9F4",
    padding: 20,
    paddingTop: 50,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  backBtn: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
  },
  formCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 12,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    marginTop: 8,
  },
  uploadText: {
    marginTop: 8,
    color: "#6B7280",
    fontSize: 14,
  },
  btn: {
    backgroundColor: "#4F772D",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 30,
    shadowColor: "#4F772D",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});