import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  TextInput,
  ActivityIndicator
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { useRouter } from "expo-router";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";

// Firebase Imports
import { db, auth } from "../../../firebaseConfig";
import { doc, onSnapshot, collection, query, where, addDoc, serverTimestamp, updateDoc, orderBy } from "firebase/firestore";

const screenWidth = Dimensions.get("window").width;

export default function SellerDashboard() {
  const router = useRouter();
  const user = auth.currentUser;

  // States
  const [loading, setLoading] = useState(true);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [issueDescription, setIssueDescription] = useState("");
  const [sellerData, setSellerData] = useState<any>(null);
  
  //Data for compartment 3 according to objective 1 of the proposal [citation: 38]
  const [binData, setBinData] = useState({
    plastic: { level: 0, weight: 0 },
    food: { level: 0, weight: 0, moisture: 0 },
    metal: { level: 0, weight: 0 },
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [notifiedBins, setNotifiedBins] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    //1. Retrieve User Profile Data (Name, Points)
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setSellerData(docSnap.data());
      }
    }, (error) => console.log("User Fetch Error:", error));

    // 2. Sensor data (Fill Level, Weight, Moisture)
    const binDocRef = doc(db, "bins", user.uid);
    const unsubscribeBins = onSnapshot(binDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBinData(data as any);
      }
      setLoading(false);
    }, (error) => {
      console.log("Bin Fetch Error:", error);
      setLoading(false);
    });

    // 3. Notifications List (Sorted client-side to avoid index error)
    const q = query(
      collection(db, "notifications"),
      where("toUid", "==", user.uid)
    );
    const unsubscribeNotifs = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Client-side sort by createdAt descending
      list.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setNotifications(list);
      setUnreadCount(list.filter((n: any) => !n.read).length);
    });

    return () => {
      unsubscribeUser();
      unsubscribeBins();
      unsubscribeNotifs();
    };
  }, [user]);

  // Automated Bin Full Notifications
  useEffect(() => {
    if (!user) return;

    const checkAndNotify = async (type: string, level: number) => {
      if (level > 80 && !notifiedBins.includes(type)) {
        try {
          await addDoc(collection(db, "notifications"), {
            toUid: user.uid,
            type: "bin_full",
            message: `${type.charAt(0).toUpperCase() + type.slice(1)} bin is over 80% full`,
            read: false,
            createdAt: serverTimestamp(),
          });
          setNotifiedBins(prev => [...prev, type]);
        } catch (error) {
          console.error("Error sending bin notification:", error);
        }
      } else if (level <= 80 && notifiedBins.includes(type)) {
        // Reset notification state if it drops below threshold
        setNotifiedBins(prev => prev.filter(t => t !== type));
      }
    };

    checkAndNotify("plastic", binData.plastic?.level);
    checkAndNotify("food", binData.food?.level);
    checkAndNotify("metal", binData.metal?.level);
  }, [binData, user]);

  const handleReportSubmit = () => {
    if (issueDescription.trim() === "") {
      Alert.alert("Error", "Please enter the issue details.");
      return;
    }
    Alert.alert("Issue Reported", "Maintenance team has been notified.");
    setReportModalVisible(false);
    setIssueDescription("");
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      for (const n of unread) {
        await updateDoc(doc(db, "notifications", n.id), { read: true });
      }
    } catch (error) {
      console.error("Error marking read:", error);
    }
  };

  // Bin Card UI Component
  const BinCard = ({ title, level, weight, color, moisture }: any) => (
    <View style={[styles.binCard, { backgroundColor: color }]}>
      <Text style={styles.binTitle}>{title}</Text>
      <Text style={styles.percent}>{level || 0}% Full</Text>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${level || 0}%` }]} />
      </View>
      <Text style={styles.kg}>{weight || 0} kg</Text>
      {moisture !== undefined && (
        <View style={styles.moistureRow}>
          <Text style={[styles.moistureText, moisture > 70 && styles.moistureHigh]}>
            💧 {moisture}%
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#4F772D" />
      <Text style={{marginTop: 10}}>Loading IoT Data...</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F9F4" }}>
      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingTop: 60 }} 
        showsVerticalScrollIndicator={false}
      >

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.header}>Hello, {sellerData?.fullName || "Member"} 👋</Text>
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardText}>🏆 {sellerData?.points || 0} Pts</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.notifBtn} 
            onPress={() => {
              setNotifModalVisible(true);
              markAllAsRead();
            }}
          >
            <Ionicons name="notifications-outline" size={26} color="#4F772D" />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Bin Monitoring Section [cite: 38] */}
        <Text style={styles.sectionTitle}>Live Bin Monitoring (IoT)</Text>
        <View style={styles.row}>
          <BinCard title="Plastic" level={binData.plastic?.level} weight={binData.plastic?.weight} color="#4CAF50" />
          <BinCard title="Food" level={binData.food?.level} weight={binData.food?.weight} moisture={binData.food?.moisture} color="#F4A261" />
          <BinCard title="Metal" level={binData.metal?.level} weight={binData.metal?.weight} color="#9CA3AF" />
        </View>

        {/* High Moisture Warning [cite: research proposal moisture sensor] */}
        {(binData.food?.moisture ?? 0) > 70 && (
          <View style={styles.moistureWarning}>
            <Ionicons name="water" size={20} color="#B45309" />
            <Text style={styles.moistureWarningText}>
              ⚠️ High moisture detected in food bin ({binData.food.moisture}%)
            </Text>
          </View>
        )}

        {/* Analytics Chart Section */}
        <Text style={styles.sectionTitle}>Waste Weight Distribution</Text>
        <View style={styles.chartContainer}>
          <PieChart
            data={[
              { name: "Plastic", population: binData.plastic?.weight || 0.1, color: "#4CAF50", legendFontColor: "#333", legendFontSize: 12 },
              { name: "Food", population: binData.food?.weight || 0.1, color: "#F4A261", legendFontColor: "#333", legendFontSize: 12 },
              { name: "Metal", population: binData.metal?.weight || 0.1, color: "#9CA3AF", legendFontColor: "#333", legendFontSize: 12 },
            ]}
            width={screenWidth - 40}
            height={200}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute // To display numbers directly
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
          />
        </View>

        {/* Map Section */}
        <Text style={styles.sectionTitle}>Smart Bin Location</Text>
        <View style={styles.mapBox}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: sellerData?.location?.latitude || 6.9271, 
              longitude: sellerData?.location?.longitude || 79.8612, 
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker 
              coordinate={{ 
                latitude: sellerData?.location?.latitude || 6.9271, 
                longitude: sellerData?.location?.longitude || 79.8612 
              }} 
              pinColor="#4CAF50"
            />
          </MapView>
        </View>

        {/* Report Button */}
        <TouchableOpacity style={styles.reportBtn} onPress={() => setReportModalVisible(true)}>
          <Ionicons name="warning-outline" size={20} color="#EF4444" />
          <Text style={styles.reportText}>Report Bin Maintenance Issue</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Report Modal */}
      <Modal animationType="slide" transparent={true} visible={reportModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report an Issue</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Describe the issue with sensors or bin..."
              multiline value={issueDescription}
              onChangeText={setIssueDescription}
            />
            <TouchableOpacity style={styles.submitBtn} onPress={handleReportSubmit}>
              <Text style={styles.submitBtnText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal animationType="fade" transparent={true} visible={notifModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotifModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ maxHeight: 400 }}>
              {notifications.length === 0 ? (
                <Text style={styles.emptyNotif}>No notifications yet</Text>
              ) : (
                notifications.map((notif) => (
                  <View key={notif.id} style={[styles.notifItem, !notif.read && styles.unreadNotif]}>
                    <View style={styles.notifIcon}>
                      <Ionicons 
                        name={notif.type === 'order_cancelled' ? "alert-circle" : "notifications"} 
                        size={20} 
                        color={notif.type === 'order_cancelled' ? "#EF4444" : "#4F772D"} 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.notifMsg, 
                        notif.type === 'order_cancelled' && { color: '#EF4444', fontWeight: 'bold' }
                      ]}>
                        {notif.message}
                      </Text>
                      <Text style={styles.notifTime}>
                        {notif.createdAt?.toDate() ? notif.createdAt.toDate().toLocaleTimeString() : 'Just now'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Navigation Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#4F772D" />
          <Text style={[styles.navText, { color: "#4F772D" }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/seller/AddWaste" as any)}>
          <Ionicons name="add-circle-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Market</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(tabs)/seller/SellerProfile" as any)}>
          <Ionicons name="person-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  header: { fontSize: 18, fontWeight: "700", color: "#111827", flex: 1 },
  rewardBadge: { backgroundColor: "#FFD700", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  rewardText: { fontWeight: "bold", color: "#333", fontSize: 12 },
  notifBtn: { padding: 8, position: 'relative' },
  notifBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fff' },
  notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#374151", marginBottom: 12, marginTop: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  binCard: { 
    width: "31%", 
    borderRadius: 15, 
    padding: 10, 
    elevation: 3,
    overflow: 'hidden', // background color borderRadius clip කිරීම සඳහා
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  binTitle: { fontSize: 11, color: "#fff", fontWeight: "bold" },
  percent: { fontSize: 15, fontWeight: "700", color: "#fff", marginVertical: 5 },
  progressBg: { height: 4, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 10 },
  progressFill: { height: 4, backgroundColor: "#fff", borderRadius: 10 },
  kg: { marginTop: 5, fontSize: 12, color: "#fff", fontWeight: "600" },
  moistureRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center' },
  moistureText: { fontSize: 9, color: "#fff", fontStyle: 'italic', fontWeight: '600' },
  moistureHigh: { color: '#FEF3C7' },
  moistureWarning: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FCD34D', gap: 8 },
  moistureWarningText: { flex: 1, fontSize: 13, color: '#92400E', fontWeight: '600' },
  chartContainer: { backgroundColor: '#fff', borderRadius: 20, padding: 10, elevation: 2, marginBottom: 20 },
  mapBox: { height: 160, borderRadius: 20, overflow: "hidden", marginBottom: 15, elevation: 2 },
  map: { width: "100%", height: "100%" },
  reportBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#FEE2E2", padding: 15, borderRadius: 15, borderWidth: 1, borderColor: "#FCA5A5" },
  reportText: { color: "#EF4444", fontWeight: "700", marginLeft: 8 },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalView: { width: "85%", backgroundColor: "white", borderRadius: 24, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  modalInput: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 12, padding: 12, height: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: "#EF4444", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 20 },
  submitBtnText: { color: "white", fontWeight: "bold" },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-around", backgroundColor: "#FFFFFF", paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  navItem: { alignItems: "center", width: 60 },
  navText: { fontSize: 10, color: "#9CA3AF", marginTop: 4 },

  // Notification Styles
  notifItem: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
  unreadNotif: { backgroundColor: '#F9FAFB' },
  notifIcon: { marginRight: 12 },
  notifMsg: { fontSize: 14, color: '#374151', lineHeight: 20 },
  notifTime: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  emptyNotif: { textAlign: 'center', color: '#9CA3AF', marginVertical: 20 }
});