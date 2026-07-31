import { View, Text, StyleSheet, Alert, Image } from "react-native";
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

export default function BuyerProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalWeight: 0
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!auth.currentUser) return;
      try {
        // 1. Fetch User Info
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // 2. Fetch Order Stats
        const q = query(
          collection(db, "orders"),
          where("buyerUid", "==", auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);

        let weight = 0;
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          weight += (data.weightKg || 0);
        });

        setStats({ totalPurchases: querySnapshot.size, totalWeight: weight });
      } catch (error) {
        console.error("Error fetching buyer profile stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const user = auth.currentUser;

  // Firebase logout — clears the session stored in AsyncStorage
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace("/(tabs)/Welcome" as any);
          } catch {
            Alert.alert("Error", "Could not logout. Please try again.");
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <Screen>
        <LoadingState message="Loading your profile…" />
      </Screen>
    );
  }

  const weightLabel = stats.totalWeight >= 1000
    ? (stats.totalWeight / 1000).toFixed(1) + ' t'
    : stats.totalWeight + ' kg';

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
                {userData?.fullName ? userData.fullName[0].toUpperCase() : "B"}
              </Text>
            )}
          </View>

          <Text style={styles.name} numberOfLines={2}>{userData?.fullName || "Buyer"}</Text>
          <Text style={Type.small}>{user?.email || "No Email"}</Text>

          <View style={styles.rolePill}>
            <Ionicons name="repeat-outline" size={12} color={Palette.brand[700]} />
            <Text style={styles.rolePillText}>Recycling buyer</Text>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={13} color={Palette.brand[600]} />
            <Text style={Type.small} numberOfLines={1}>
              {userData?.location || "Address not set"}
            </Text>
          </View>
        </Card>

        {/* Purchase stats */}
        <SectionTitle>Your purchases</SectionTitle>
        <View style={styles.tileRow}>
          <StatTile
            value={String(stats.totalPurchases)}
            label="Orders placed"
            icon="cart-outline"
          />
          <StatTile value={weightLabel} label="Waste bought" icon="scale-outline" />
        </View>

        {/* Recycling impact */}
        <SectionTitle>Recycling impact 🌍</SectionTitle>
        <View style={styles.tileRow}>
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
        <Text style={styles.impactNote}>
          Estimated using standard recycling conversion factors.
        </Text>

        {/* Settings */}
        <SectionTitle>Account settings</SectionTitle>
        <ListOption
          icon="storefront-outline"
          title="Browse marketplace"
          subtitle="Find recyclable waste near you"
          onPress={() => router.push("/(tabs)/buyer/BuyerDashboard" as any)}
        />
        <ListOption
          icon="person-outline"
          title="Edit profile"
          subtitle="Company name, phone and address"
          onPress={() => router.push("/(tabs)/buyer/EditProfile" as any)}
        />
        <ListOption
          icon="cart-outline"
          title="My purchases"
          subtitle="Track your orders"
          onPress={() => router.push("/(tabs)/buyer/BuyerOrders" as any)}
        />
        <ListOption
          icon="log-out-outline"
          title="Log out"
          onPress={handleLogout}
          destructive
        />
      </Screen>

      <BottomNav role="buyer" active="profile" />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.background },
  content: { paddingTop: Space['3xl'] },

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
  name: { ...Type.h2, fontSize: 21, textAlign: 'center' },
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

  tileRow: { flexDirection: 'row', gap: Space.md },
  impactNote: { ...Type.caption, color: Palette.ink[300], marginTop: Space.sm },
});
