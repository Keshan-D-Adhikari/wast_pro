import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  TextInput,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";

// Firebase Imports
import { db, auth } from "../../../firebaseConfig";
import { doc, onSnapshot, collection, query, where, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";

import { Palette, Space, Radius, Shadow, Type, wasteAccent } from "@/constants/design";
import { Screen } from "@/components/ui/screen";
import { Card, SectionTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/empty-state";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Sheet } from "@/components/ui/sheet";

const screenWidth = Dimensions.get("window").width;

const COMPARTMENTS: { type: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: "plastic", label: "Plastic", icon: "cube-outline" },
  { type: "food", label: "Food", icon: "leaf-outline" },
  { type: "metal", label: "Metal", icon: "construct-outline" },
];

export default function SellerDashboard() {
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
  // The bin's GeoPoint lives on the "bins" document — users.location is a
  // free-text address, so it cannot be used to place a map marker.
  const [binLocation, setBinLocation] = useState<{ latitude: number; longitude: number } | null>(null);
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
        if (
          typeof data.location?.latitude === 'number' &&
          typeof data.location?.longitude === 'number'
        ) {
          setBinLocation({
            latitude: data.location.latitude,
            longitude: data.location.longitude,
          });
        }
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

  const totalWeight = COMPARTMENTS.reduce(
    (sum, c) => sum + ((binData as any)[c.type]?.weight || 0),
    0
  );

  // Bin Card UI Component
  const BinCard = ({ type, label, icon }: { type: string; label: string; icon: keyof typeof Ionicons.glyphMap }) => {
    const compartment = (binData as any)[type] || {};
    const level = compartment.level || 0;
    const weight = compartment.weight || 0;
    const moisture = compartment.moisture;
    const accent = wasteAccent(type);
    const isFull = level > 80;

    return (
      <View style={styles.binCard}>
        <View style={styles.binTopRow}>
          <View style={[styles.binIcon, { backgroundColor: accent.tint }]}>
            <Ionicons name={icon} size={16} color={accent.base} />
          </View>
          {isFull && (
            <View style={styles.fullDot}>
              <Ionicons name="alert" size={10} color={Palette.white} />
            </View>
          )}
        </View>

        <Text style={styles.binLabel}>{label}</Text>
        <Text style={[styles.binLevel, { color: accent.base }]}>{level}%</Text>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(level, 100)}%`, backgroundColor: accent.base },
            ]}
          />
        </View>

        <Text style={styles.binWeight}>{weight} kg</Text>
        {moisture !== undefined && (
          <Text style={[styles.binMoisture, moisture > 70 && styles.binMoistureHigh]}>
            💧 {moisture}%
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <Screen>
        <LoadingState message="Reading smart bin sensors…" />
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <Screen withBottomNav>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={Type.small}>Welcome back</Text>
            <Text style={styles.headerName} numberOfLines={1}>
              {sellerData?.fullName || "Member"} 👋
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            hitSlop={8}
            accessibilityLabel="Notifications"
            onPress={() => {
              setNotifModalVisible(true);
              markAllAsRead();
            }}
          >
            <Ionicons name="notifications-outline" size={22} color={Palette.brand[700]} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Reward + total summary strip */}
        <Card tone="brand" elevation={0} style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={Type.caption}>REWARD POINTS</Text>
            <View style={styles.summaryValueRow}>
              <Ionicons name="trophy" size={16} color={Palette.reward} />
              <Text style={styles.summaryValue}>{sellerData?.points || 0}</Text>
            </View>
          </View>
          <View style={styles.summaryRule} />
          <View style={styles.summaryItem}>
            <Text style={Type.caption}>IN BINS NOW</Text>
            <View style={styles.summaryValueRow}>
              <Ionicons name="scale-outline" size={16} color={Palette.brand[600]} />
              <Text style={styles.summaryValue}>{totalWeight.toFixed(1)} kg</Text>
            </View>
          </View>
        </Card>

        {/* Bin Monitoring Section [cite: 38] */}
        <SectionTitle meta="Live">Smart bin monitoring</SectionTitle>
        <View style={styles.binRow}>
          {COMPARTMENTS.map((c) => (
            <BinCard key={c.type} type={c.type} label={c.label} icon={c.icon} />
          ))}
        </View>

        {/* High Moisture Warning [cite: research proposal moisture sensor] */}
        {(binData.food?.moisture ?? 0) > 70 && (
          <Notice
            icon="water"
            text={`High moisture detected in the food bin (${binData.food.moisture}%). Collect soon to avoid odour.`}
          />
        )}

        {/* Analytics Chart Section */}
        <SectionTitle>Waste weight distribution</SectionTitle>
        <Card>
          <PieChart
            data={COMPARTMENTS.map((c) => ({
              name: c.label,
              population: (binData as any)[c.type]?.weight || 0.1,
              color: wasteAccent(c.type).base,
              legendFontColor: Palette.ink[700],
              legendFontSize: 12,
            }))}
            width={screenWidth - Space.xl * 2 - Space.lg * 2}
            height={180}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute // To display numbers directly
            chartConfig={{
              color: (opacity = 1) => `rgba(20, 38, 26, ${opacity})`,
            }}
          />
        </Card>

        {/* Map Section */}
        <SectionTitle meta={binLocation ? undefined : 'Not set'}>Smart bin location</SectionTitle>
        <Card style={styles.mapCard} elevation={1}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: binLocation?.latitude ?? 6.9271,
              longitude: binLocation?.longitude ?? 79.8612,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {binLocation && (
              <Marker coordinate={binLocation} pinColor={Palette.brand[600]} />
            )}
          </MapView>
        </Card>

        {/* Report Button */}
        <Button
          label="Report bin maintenance issue"
          icon="warning-outline"
          variant="danger"
          onPress={() => setReportModalVisible(true)}
          style={styles.reportBtn}
        />
      </Screen>

      {/* Report Sheet */}
      <Sheet
        visible={reportModalVisible}
        title="Report an issue"
        onClose={() => setReportModalVisible(false)}
      >
        <Text style={[Type.small, styles.sheetHint]}>
          Describe what’s wrong with the bin or its sensors.
        </Text>
        <TextInput
          style={styles.reportInput}
          placeholder="e.g. the plastic compartment sensor reads 0% when full"
          placeholderTextColor={Palette.ink[300]}
          multiline
          value={issueDescription}
          onChangeText={setIssueDescription}
        />
        <Button label="Submit report" variant="danger" onPress={handleReportSubmit} />
      </Sheet>

      {/* Notifications Sheet */}
      <Sheet
        visible={notifModalVisible}
        title="Notifications"
        onClose={() => setNotifModalVisible(false)}
        scrollable
      >
        {notifications.length === 0 ? (
          <Text style={[Type.small, styles.emptyNotif]}>No notifications yet</Text>
        ) : (
          notifications.map((notif) => {
            const isAlert = notif.type === 'order_cancelled';
            const tone = isAlert ? Palette.status.danger : Palette.status.success;
            return (
              <View key={notif.id} style={styles.notifItem}>
                <View style={[styles.notifIcon, { backgroundColor: tone.tint }]}>
                  <Ionicons
                    name={isAlert ? "alert-circle" : "notifications"}
                    size={16}
                    color={tone.base}
                  />
                </View>
                <View style={styles.notifBody}>
                  <Text style={[Type.small, isAlert && styles.notifAlert]}>{notif.message}</Text>
                  <Text style={styles.notifTime}>
                    {notif.createdAt?.toDate()
                      ? notif.createdAt.toDate().toLocaleString()
                      : 'Just now'}
                  </Text>
                </View>
                {!notif.read && <View style={styles.unreadDot} />}
              </View>
            );
          })
        )}
      </Sheet>

      <BottomNav role="seller" active="home" />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.background },

  headerRow: { flexDirection: "row", alignItems: "center", gap: Space.md, marginBottom: Space.xl },
  headerText: { flex: 1 },
  headerName: { ...Type.h1, fontSize: 24, marginTop: 2 },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow[1],
  },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: Radius.pill,
    backgroundColor: Palette.status.danger.base,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.surface,
  },
  notifBadgeText: { color: Palette.white, fontSize: 9, fontWeight: '800' },

  summaryCard: { flexDirection: 'row', alignItems: 'center', padding: Space.lg },
  summaryItem: { flex: 1, gap: Space.xs },
  summaryValueRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  summaryValue: { ...Type.h2, color: Palette.brand[900] },
  summaryRule: { width: 1, height: 34, backgroundColor: Palette.brand[200], marginHorizontal: Space.lg },

  binRow: { flexDirection: "row", gap: Space.md },
  binCard: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Space.md,
    ...Shadow[1],
  },
  binTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  binIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullDot: {
    width: 16,
    height: 16,
    borderRadius: Radius.pill,
    backgroundColor: Palette.status.danger.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  binLabel: { ...Type.caption, marginTop: Space.md },
  binLevel: { fontSize: 22, fontWeight: '800', lineHeight: 27, marginBottom: Space.sm },
  progressTrack: {
    height: 5,
    borderRadius: Radius.pill,
    backgroundColor: Palette.ink[100],
    overflow: 'hidden',
  },
  progressFill: { height: 5, borderRadius: Radius.pill },
  binWeight: { ...Type.smallStrong, marginTop: Space.sm },
  binMoisture: { ...Type.caption, marginTop: 2 },
  binMoistureHigh: { color: Palette.status.warning.base, fontWeight: '700' },

  mapCard: { padding: 0, overflow: 'hidden', height: 170 },
  map: { width: "100%", height: "100%" },

  reportBtn: { marginTop: Space['2xl'] },

  sheetHint: { marginBottom: Space.md },
  reportInput: {
    ...Type.body,
    color: Palette.ink[900],
    borderWidth: 1,
    borderColor: Palette.ink[200],
    borderRadius: Radius.md,
    backgroundColor: Palette.background,
    padding: Space.lg,
    height: 110,
    textAlignVertical: 'top',
    marginBottom: Space.xl,
  },

  emptyNotif: { textAlign: 'center', paddingVertical: Space['2xl'] },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    paddingVertical: Space.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.ink[100],
  },
  notifIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBody: { flex: 1 },
  notifAlert: { color: Palette.status.danger.base, fontWeight: '600' },
  notifTime: { ...Type.caption, color: Palette.ink[300], marginTop: 2 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brand[600],
  },
});
