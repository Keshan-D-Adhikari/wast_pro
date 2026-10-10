import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, APP_MAP_PROVIDER } from "../../../components/platform-map";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useRef } from "react";

// Firebase Imports
import { db } from "../../../firebaseConfig";
import { useAuthUser } from "../../../hooks/useAuthUser";
import { doc, onSnapshot, collection, query, where, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { iotDb, DEFAULT_BIN_ID, USE_MOCK_IOT, MOCK_BIN_DATA_NORMAL, MOCK_BIN_DATA_ALERT } from "../../../iotConfig";
import { normalizeBin, describeFreshness } from "../../../utils/binTelemetry";
import { ref as dbRef, onValue } from "firebase/database";

import { Palette, Space, Radius, Shadow, Type, wasteAccent } from "@/constants/design";
import { binStatusColor, binStatusLabel, isBinFull } from "@/constants/bin-status";
import { Screen } from "@/components/ui/screen";
import { Card, SectionTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/empty-state";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Sheet } from "@/components/ui/sheet";
import { DonutChart } from "@/components/ui/donut-chart";
import { AppNotification, BinData, UserProfile, WasteType } from "../../../types";

const COMPARTMENTS: { type: WasteType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: "plastic", label: "Plastic", icon: "cube-outline" },
  { type: "food", label: "Food", icon: "leaf-outline" },
  { type: "metal", label: "Metal", icon: "construct-outline" },
];

const EMPTY_BIN: BinData = {
  plastic: { level: 0, weight: 0 },
  food: { level: 0, weight: 0, moisture: 0 },
  metal: { level: 0, weight: 0 },
};

export default function SellerDashboard() {
  const user = useAuthUser();

  // States
  const [loading, setLoading] = useState(true);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [issueDescription, setIssueDescription] = useState("");
  const [sellerData, setSellerData] = useState<UserProfile | null>(null);

  //Data for compartment 3 according to objective 1 of the proposal [citation: 38]
  const [mockPreset, setMockPreset] = useState<'normal' | 'alert'>('normal');
  const [liveBinData, setBinData] = useState<BinData>(EMPTY_BIN);
  // The bin this seller is linked to (set by an admin on their profile); everyone else sees the default prototype bin.
  const binId = sellerData?.binId || DEFAULT_BIN_ID;
  // In mock mode the bin data is derived from the selected preset during
  // render, rather than copied into state from an effect.
  const binData: BinData = USE_MOCK_IOT
    ? (mockPreset === 'alert' ? MOCK_BIN_DATA_ALERT : MOCK_BIN_DATA_NORMAL)
    : liveBinData;

  // Re-evaluate "live vs offline" periodically so the badge turns Offline on
  // its own if the firmware stops uploading.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);
  const freshness = USE_MOCK_IOT
    ? { live: true, label: 'Demo data' }
    : describeFreshness(binData.lastUpdated, now);
  // The ESP32 firmware doesn't upload GPS coordinates (it only sends a place name), so the
  // seller saves where the bin is on their profile with the button under the map.
  const binLocation = sellerData?.binLocation ?? null;
  const [savingLocation, setSavingLocation] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  // Tracks which bins we've already sent an "over 80%" notification for.
  // A ref (not state) because it's pure bookkeeping — never rendered — and
  // keeping it out of state avoids re-running the notify effect on every change.
  const notifiedBinsRef = useRef<WasteType[]>([]);

  useEffect(() => {
    if (!user) return;

    //1. Retrieve User Profile Data (Name, Points)
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setSellerData(docSnap.data() as UserProfile);
      }
    }, (error) => console.error("User fetch error:", error));

    // 2. Notifications List (Sorted client-side to avoid index error)
    const q = query(
      collection(db, "notifications"),
      where("toUid", "==", user.uid)
    );
    const unsubscribeNotifs = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
      // Client-side sort by createdAt descending
      list.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    });

    return () => {
      unsubscribeUser();
      unsubscribeNotifs();
    };
  }, [user]);

  // Live sensor data (fill level, weight) for this seller's bin, from the ESP32's Realtime Database.
  useEffect(() => {
    if (USE_MOCK_IOT) return;

    return onValue(dbRef(iotDb, `bins/${binId}`), (snapshot) => {
      const normalized = snapshot.exists() ? normalizeBin(snapshot.val()) : null;
      // A bin with no data yet shows as empty/offline rather than keeping another bin's readings.
      setBinData(normalized ?? EMPTY_BIN);
      setLoading(false);
    }, (error) => {
      console.error("Bin fetch error:", error);
      setLoading(false);
    });
  }, [binId]);

  // Automated Bin Full Notifications — driven by the firmware's own `status`
  // and `overweight` fields (see constants/bin-status.ts) rather than a
  // level percentage re-derived in the app, so the alert matches exactly
  // what the ESP32 itself decided.
  useEffect(() => {
    // Never alert from stale data: an old FULL reading from an offline bin
    // would otherwise raise a "bin is full" notification right now.
    if (!user || !freshness.live) return;

    const checkAndNotify = async (
      type: WasteType,
      status: string | undefined,
      overweight: boolean | undefined
    ) => {
      const shouldAlert = isBinFull(status) || !!overweight;

      if (shouldAlert && !notifiedBinsRef.current.includes(type)) {
        try {
          const reason = overweight ? 'is overweight' : 'is full';
          await addDoc(collection(db, "notifications"), {
            toUid: user.uid,
            type: "bin_full",
            message: `${type.charAt(0).toUpperCase() + type.slice(1)} bin ${reason}`,
            read: false,
            createdAt: serverTimestamp(),
          });
          notifiedBinsRef.current = [...notifiedBinsRef.current, type];
        } catch (error) {
          console.error("Error sending bin notification:", error);
        }
      } else if (!shouldAlert && notifiedBinsRef.current.includes(type)) {
        // Reset notification state once the firmware clears the condition
        notifiedBinsRef.current = notifiedBinsRef.current.filter(t => t !== type);
      }
    };

    checkAndNotify("plastic", binData.plastic?.status, binData.plastic?.overweight);
    checkAndNotify("food", binData.food?.status, binData.food?.overweight);
    checkAndNotify("metal", binData.metal?.status, binData.metal?.overweight);
  }, [binData, user, freshness.live]);

  // Save the phone's current position as the bin's location (the seller is standing at the bin).
  const handleSetBinLocation = async () => {
    if (!user) return;
    setSavingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location needed', 'Allow location access so we can place the bin on the map.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await updateDoc(doc(db, "users", user.uid), {
        binLocation: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
      });
    } catch (error) {
      console.error("Could not save bin location:", error);
      Alert.alert('Error', 'Could not save the bin location. Please try again.');
    } finally {
      setSavingLocation(false);
    }
  };

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
    (sum, c) => sum + (binData[c.type]?.weight || 0),
    0
  );

  // Bin Card UI Component
  const BinCard = ({ type, label, icon }: { type: WasteType; label: string; icon: keyof typeof Ionicons.glyphMap }) => {
    const compartment = binData[type] || {};
    const level = compartment.level || 0;
    const weight = compartment.weight || 0;
    const moisture = compartment.moisture;
    const accent = wasteAccent(type);
    const alert = isBinFull(compartment.status) || !!compartment.overweight;
    const statusColor = binStatusColor(compartment.status);

    return (
      <View style={styles.binCard}>
        <View style={styles.binTopRow}>
          <View style={[styles.binIcon, { backgroundColor: accent.tint }]}>
            <Ionicons name={icon} size={16} color={accent.base} />
          </View>
          {alert && (
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

        <View style={[styles.statusPill, { backgroundColor: statusColor.tint }]}>
          <Text style={[styles.statusPillText, { color: statusColor.base }]}>
            {binStatusLabel(compartment.status)}
          </Text>
        </View>

        <Text style={styles.binWeight}>{weight} kg</Text>
        {compartment.overweight && (
          <Text style={styles.binOverweight}>⚠ Overweight</Text>
        )}
        {moisture !== undefined && (
          <Text style={[styles.binMoisture, moisture > 70 && styles.binMoistureHigh]}>
            💧 {moisture}%
          </Text>
        )}
      </View>
    );
  };

  if (loading && !USE_MOCK_IOT) {
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

        {/* Demo / Mock Telemetry Mode Banner */}
        {USE_MOCK_IOT && (
          <View style={styles.demoBanner}>
            <View style={styles.demoBannerHeader}>
              <Ionicons name="flask-outline" size={16} color={Palette.status.warning.base} />
              <Text style={styles.demoBannerTitle}>DEMO / MOCK TELEMETRY MODE</Text>
            </View>
            <Text style={styles.demoBannerSubtitle}>
              Hardware simulation active. Toggle preset to test fill levels & alerts:
            </Text>
            <View style={styles.demoToggleRow}>
              <TouchableOpacity
                style={[styles.demoToggleBtn, mockPreset === 'normal' && styles.demoToggleBtnActive]}
                onPress={() => setMockPreset('normal')}
                accessibilityRole="button"
                accessibilityLabel="Set mock preset to normal"
              >
                <Text style={[styles.demoToggleText, mockPreset === 'normal' && styles.demoToggleTextActive]}>
                  Preset: Normal (Low/Half)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.demoToggleBtn, mockPreset === 'alert' && styles.demoToggleBtnActiveAlert]}
                onPress={() => setMockPreset('alert')}
                accessibilityRole="button"
                accessibilityLabel="Set mock preset to alert"
              >
                <Text style={[styles.demoToggleText, mockPreset === 'alert' && styles.demoToggleTextActiveAlert]}>
                  Preset: Alert (Full/Overweight)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bin Monitoring Section [cite: 38] */}
        <SectionTitle meta={USE_MOCK_IOT ? "DEMO / MOCK" : freshness.live ? "Bin ON" : "Bin OFF"}>Smart bin monitoring</SectionTitle>
        <View style={styles.binRow}>
          {COMPARTMENTS.map((c) => (
            <BinCard key={c.type} type={c.type} label={c.label} icon={c.icon} />
          ))}
        </View>
        <Text style={styles.lastUpdated}>
          {binId} · {freshness.label}
          {binData.lastUpdated ? ` · ${new Date(binData.lastUpdated).toLocaleString()}` : ''}
          {binData.location ? ` · ${binData.location}` : ''}
        </Text>
        {!freshness.live && (
          <Notice
            icon="cloud-offline-outline"
            text="The smart bin hasn't sent data recently, so these are the last known readings and no new alerts are raised."
          />
        )}

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
          <DonutChart
            items={COMPARTMENTS.map((c) => ({
              label: c.label,
              value: binData[c.type]?.weight || 0,
              color: wasteAccent(c.type).base,
            }))}
          />
        </Card>

        {/* Map Section */}
        <SectionTitle meta={binLocation ? (binData.location || 'Saved') : 'Not set'}>Smart bin location</SectionTitle>
        <Card style={styles.mapCard} elevation={1}>
          <MapView
            key={binLocation ? `${binLocation.latitude},${binLocation.longitude}` : 'no-bin-location'}
            provider={APP_MAP_PROVIDER}
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
        <Button
          label={binLocation ? "Update bin location to where I am now" : "Set bin location to where I am now"}
          icon="locate-outline"
          variant="secondary"
          onPress={handleSetBinLocation}
          loading={savingLocation}
          style={styles.locationBtn}
        />

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
  lastUpdated: { ...Type.caption, color: Palette.ink[500], marginTop: Space.sm, marginBottom: Space.md },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: Space.sm,
    paddingHorizontal: Space.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  statusPillText: { ...Type.caption, fontWeight: '700' },
  binWeight: { ...Type.smallStrong, marginTop: Space.sm },
  binOverweight: { ...Type.caption, color: Palette.status.danger.base, fontWeight: '700', marginTop: 2 },
  binMoisture: { ...Type.caption, marginTop: 2 },
  binMoistureHigh: { color: Palette.status.warning.base, fontWeight: '700' },

  mapCard: { padding: 0, overflow: 'hidden', height: 170 },
  locationBtn: { marginTop: Space.md },
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

  demoBanner: {
    backgroundColor: Palette.status.warning.tint,
    borderWidth: 1,
    borderColor: 'rgba(180, 83, 9, 0.25)',
    borderRadius: Radius.lg,
    padding: Space.lg,
    marginTop: Space.lg,
    marginBottom: Space.sm,
  },
  demoBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    marginBottom: 4,
  },
  demoBannerTitle: {
    ...Type.caption,
    color: Palette.status.warning.base,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  demoBannerSubtitle: {
    ...Type.small,
    color: Palette.ink[700],
    marginBottom: Space.md,
  },
  demoToggleRow: {
    flexDirection: 'row',
    gap: Space.sm,
  },
  demoToggleBtn: {
    flex: 1,
    paddingVertical: Space.sm,
    paddingHorizontal: Space.sm,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surface,
    borderWidth: 1.5,
    borderColor: Palette.ink[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoToggleBtnActive: {
    backgroundColor: Palette.brand[50],
    borderColor: Palette.brand[600],
  },
  demoToggleBtnActiveAlert: {
    backgroundColor: Palette.status.danger.tint,
    borderColor: Palette.status.danger.base,
  },
  demoToggleText: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.ink[700],
    textAlign: 'center',
  },
  demoToggleTextActive: {
    color: Palette.brand[700],
    fontWeight: '700',
  },
  demoToggleTextActiveAlert: {
    color: Palette.status.danger.base,
    fontWeight: '700',
  },
});
