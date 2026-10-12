// SELLER PROFILE SCREEN
// Who uses it: a logged in seller (waste provider). It is the "profile" tab of the seller
// bottom navigation.
// What it shows: the seller's identity card, total money earned, total waste sold, an
// estimate of the environmental impact, and links to other screens (dashboard, edit
// profile, orders) plus the log out button.
// Data it reads (it never writes):
//   - Firestore users/{uid}                  -> name, email, photo, location, binId
//   - Firestore orders (sellerUid == me, status == completed) -> sums for the stats
// Log out uses Firebase Auth signOut and then sends the user back to the Welcome screen.
import { formatRs } from '../../../utils/money';
import { View, Text, StyleSheet, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { db, auth } from "../../../firebaseConfig";
import { signOut } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

import { Palette, Space, Radius, Type } from "@/constants/design";
import { Screen } from "@/components/ui/screen";
import { Card, SectionTitle } from "@/components/ui/card";
import { ListOption, StatTile } from "@/components/ui/list-option";
import { LoadingState } from "@/components/ui/empty-state";
import { BottomNav } from "@/components/ui/bottom-nav";
import { IdBadge } from "@/components/ui/id-badge";
import { userCode } from "../../../utils/shortId";
import { formatKgTotal } from "../../../utils/donut";
import { DEFAULT_BIN_ID } from "../../../iotConfig";
import { UserProfile } from "../../../types";

// Main component of the screen.
export default function SellerProfile() {
  // The router lets us move to other screens (push / replace).
  const router = useRouter();
  // loading is true until the profile and stats are fetched. While true we show a spinner.
  const [loading, setLoading] = useState(true);
  // userData holds the seller's profile document. null means not loaded yet.
  // useState keeps a value that, when changed, makes React draw the screen again.
  const [userData, setUserData] = useState<UserProfile | null>(null);
  // stats are the totals worked out from the seller's completed orders.
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalWeight: 0
  });

  // useEffect with [] runs once, when the screen first appears.
  // We use it to load the data from Firestore one time (no live listener here).
  useEffect(() => {
    // An async function is needed because Firestore calls return promises (we await them).
    const fetchProfileData = async () => {
      // No logged in user yet, so there is nothing to load.
      if (!auth.currentUser) return;
      try {
        // Step 1: read this seller's profile document from the users collection.
        // 1. Fetch User Info
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserProfile);
        }

        // Step 2: read all COMPLETED orders where this user is the seller, then add them up.
        // The two where() filters are combined with AND.
        // 2. Fetch Order Stats
        const q = query(
          collection(db, "orders"),
          where("sellerUid", "==", auth.currentUser.uid),
          where("status", "==", "completed")
        );
        const querySnapshot = await getDocs(q);

        // Add the price and weight of every completed order.
        // || 0 protects us if a field is missing.
        let earned = 0;
        let weight = 0;
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          earned += (data.totalPrice || 0);
          weight += (data.weightKg || 0);
        });

        setStats({ totalEarned: earned, totalWeight: weight });
      // If Firestore fails we only log it. The screen still shows with zero stats.
      } catch (error) {
        console.error("Error fetching seller profile stats:", error);
      // finally runs on success and on error, so the spinner always stops.
      } finally {
        setLoading(false);
      }
    };

    // Start the loading function.
    fetchProfileData();
  }, []);

  // Asks for confirmation, then logs the seller out.
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            // signOut ends the Firebase session. Without it the login would stay saved on the phone.
            // Clear the Firebase session, otherwise it stays in AsyncStorage
            await signOut(auth);
            // router.replace swaps the current screen for Welcome, so the back button
            // cannot return to this logged in screen (push would keep it in the history).
            router.replace("/(tabs)/Welcome");
          } catch {
            Alert.alert("Error", "Could not logout. Please try again.");
          }
        },
      },
    ]);
  };

  // Show only a spinner while loading.
  if (loading) {
    return (
      <Screen>
        <LoadingState message="Loading your profile…" />
      </Screen>
    );
  }

  // Format the earned money. 1000 or more is shown short, like Rs 1.5K.
  const earnedLabel = stats.totalEarned >= 1000
    ? 'Rs ' + (stats.totalEarned / 1000).toFixed(1) + 'K'
    : formatRs(stats.totalEarned);

  // Screen body: a scrollable page and the bottom tab bar on top of a plain background view.
  return (
    <View style={styles.root}>
      <Screen withBottomNav contentStyle={styles.content}>
        {/* Identity card */}
        <Card style={styles.identityCard} elevation={2}>
          <View style={styles.avatar}>
            {userData?.photoURL ? (
              <Image source={{ uri: userData.photoURL }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {userData?.fullName ? userData.fullName[0].toUpperCase() : "S"}
              </Text>
            )}
          </View>

          <Text style={styles.name} numberOfLines={1}>{userData?.fullName || "Seller"}</Text>
          <Text style={Type.small}>{userData?.email || "No Email"}</Text>
          <IdBadge label="Your ID" code={userCode(auth.currentUser?.uid)} />
          <IdBadge label="Smart bin" code={userData?.binId || DEFAULT_BIN_ID} />

          <View style={styles.rolePill}>
            <Ionicons name="trash-outline" size={12} color={Palette.brand[700]} />
            <Text style={styles.rolePillText}>Waste provider</Text>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={13} color={Palette.brand[600]} />
            <Text style={Type.small} numberOfLines={1}>
              {userData?.location || "Address not set"}
            </Text>
          </View>
        </Card>

        {/* Sales stats */}
        <SectionTitle>Your sales</SectionTitle>
        <View style={styles.tileRow}>
          {/* Two small tiles: money earned and total weight sold */}
          <StatTile value={earnedLabel} label="Total earned" icon="wallet-outline" />
          <StatTile value={`${formatKgTotal(stats.totalWeight)} kg`} label="Waste sold" icon="scale-outline" />
        </View>

        {/* Environmental impact */}
        <SectionTitle>Your environmental impact 🌍</SectionTitle>
        <View style={styles.tileRow}>
          {/* Impact numbers are only estimates: weight in kg multiplied by a fixed factor */}
          {/* (0.05 trees, 0.27 kg CO2, 0.47 kWh energy per kg). */}
          <StatTile
            value={(stats.totalWeight * 0.05).toFixed(1)}
            label="Trees saved"
            icon="leaf"
            color={{ base: '#10B981', tint: '#D8F3E6' }}
          />
          <StatTile
            value={`${(stats.totalWeight * 0.27).toFixed(1)} kg`}
            label="CO₂ reduced"
            icon="cloud-outline"
            color={{ base: '#0EA5E9', tint: '#DCF0FB' }}
          />
          <StatTile
            value={`${(stats.totalWeight * 0.47).toFixed(1)} kWh`}
            label="Energy saved"
            icon="flash-outline"
            color={{ base: '#D97706', tint: '#FDF0DC' }}
          />
        </View>
        {/* Small note telling the user these numbers are estimates */}
        <Text style={styles.impactNote}>
          Estimated using standard recycling conversion factors.
        </Text>

        {/* Settings */}
        <SectionTitle>Account settings</SectionTitle>
        {/* Each ListOption is a tappable row that opens another seller screen */}
        <ListOption
          icon="grid-outline"
          title="Dashboard"
          subtitle="Live bin levels and analytics"
          onPress={() => router.push("/(tabs)/seller/SellerDashboard")}
        />
        {/* router.push adds a new screen on top, so the back button returns here. */}
        <ListOption
          icon="person-outline"
          title="Edit profile"
          subtitle="Name, phone and address"
          onPress={() => router.push("/(tabs)/seller/EditProfile")}
        />
        <ListOption
          icon="receipt-outline"
          title="My orders"
          subtitle="Purchases buyers made from you"
          onPress={() => router.push("/(tabs)/seller/SellerOrders")}
        />
        <ListOption
          icon="log-out-outline"
          title="Log out"
          onPress={handleLogout}
          destructive
        />
      </Screen>

      {/* Bottom tab bar. active tells it which tab to highlight. */}
      <BottomNav role="seller" active="profile" />
    </View>
  );
}

// Styles are plain objects. StyleSheet.create checks them and makes them fast.
// Space, Radius and Type come from the shared design file so all screens look the same.
/* ================= STYLES ================= */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.background },
  content: { paddingTop: Space['3xl'] },

  // Identity card and avatar (round picture or the first letter of the name).
  identityCard: { alignItems: 'center', paddingVertical: Space['2xl'], gap: Space.xs },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Palette.brand[200],
    marginBottom: Space.md,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 32, fontWeight: '800', color: Palette.brand[600] },
  name: { ...Type.h2, fontSize: 25 },
  // Small green pill that says "Waste provider" and the address row.
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    backgroundColor: Palette.brand[100],
    paddingHorizontal: Space.md,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    marginTop: Space.sm,
  },
  rolePillText: { ...Type.caption, color: Palette.brand[700], fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: Space.xs, marginTop: Space.sm },

  // Stat tiles and the estimate note.
  tileRow: { flexDirection: 'row', gap: Space.md },
  impactNote: { ...Type.caption, color: Palette.ink[300], marginTop: Space.sm },
});
