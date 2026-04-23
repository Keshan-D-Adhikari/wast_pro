import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Platform
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../firebaseConfig';
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { db, auth } from "../../../firebaseConfig";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function EditProfile() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setName(data.fullName || "");
          setEmail(data.email || "");
          setPhone(data.phone || "");
          setLocation(data.location || "");
          if (data.photoURL) setPhotoURL(data.photoURL);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  const handlePickImage = async () => {
    Alert.alert(
      'Profile Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Camera access is required');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
            if (!result.canceled) {
              await uploadImage(result.assets[0].uri);
            }
          }
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Gallery access is required');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
            if (!result.canceled) {
              await uploadImage(result.assets[0].uri);
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const uploadImage = async (uri: string) => {
    if (!auth.currentUser) return;
    try {
      setUploading(true);
      
      // Use XMLHttpRequest instead of fetch for React Native blob compatibility
      const uploadUri = Platform.OS === 'ios' 
        ? uri.replace('file://', '') 
        : uri;

      const storageRef = ref(
        storage, 
        'profilePhotos/' + auth.currentUser.uid + '.jpg'
      );
      
      // Convert to blob using XMLHttpRequest
      const blob: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          reject(new TypeError('Network request failed'));
        };
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
      });

      // Upload blob to Firebase Storage
      const snapshot = await uploadBytes(storageRef, blob);
      
      // Close blob
      if (blob.close) blob.close();

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Save to Firestore
      await updateDoc(
        doc(db, 'users', auth.currentUser.uid), 
        { photoURL: downloadURL }
      );
      
      setPhotoURL(downloadURL);
      Alert.alert('Success', 'Profile photo updated! ✨');
      
    } catch (error: any) {
      console.error('Upload error full:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        fullName: name,
        phone: phone,
        location: location,
        updatedAt: serverTimestamp()
      });
      Alert.alert("Success", "Your profile details have been updated! ✅");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", "Failed to update profile: " + error.message);
    } finally {
      setLoading(false);
    }
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

      <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
        {photoURL ? (
          <Image source={{ uri: photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        )}
        <View style={styles.cameraBadge}>
          {uploading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="camera" size={18} color="#fff" />
          )}
        </View>
      </TouchableOpacity>

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

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          <Text style={styles.saveBtnText}>{loading ? "Saving..." : "Save Changes"}</Text>
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
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "#4F772D", overflow: "hidden" },
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