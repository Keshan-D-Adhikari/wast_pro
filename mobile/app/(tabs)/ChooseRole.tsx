import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { auth, db } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

import { Palette, Space, Radius, Shadow, Type } from '@/constants/design';
import { Button } from '@/components/ui/button';

type Role = 'seller' | 'buyer';

const ROLES: {
  key: Role;
  icon: keyof typeof Ionicons.glyphMap;
  name: string;
  desc: string;
}[] = [
  { key: 'seller', icon: 'trash-outline', name: 'Seller', desc: 'Monitor bins & sell recyclables' },
  { key: 'buyer', icon: 'repeat-outline', name: 'Buyer', desc: 'Purchase recyclable materials' },
];

/**
 * Shown once, right after a brand-new Google sign-in — Google doesn't ask
 * for a role the way CreateAccount's email/password form does, so this
 * screen fills in the same users/{uid} document before routing onward.
 */
export default function ChooseRole() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [role, setRole] = useState<Role>('seller');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.replace('/(tabs)/Login');
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        fullName: user.displayName || 'Member',
        email: user.email,
        role,
        createdAt: new Date().toISOString(),
      });

      router.replace(
        role === 'seller' ? '/(tabs)/seller/SellerDashboard' : '/(tabs)/buyer/BuyerDashboard'
      );
    } catch (error: unknown) {
      Alert.alert('Something went wrong', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/back2.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.scrim} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Space.xl, paddingBottom: insets.bottom + Space['3xl'] },
        ]}
      >
        <View style={styles.card}>
          <Text style={Type.h1}>One last step</Text>
          <Text style={[Type.small, styles.cardSubtitle]}>
            How will you use SmartWaste Pro, {auth.currentUser?.displayName?.split(' ')[0] || 'there'}?
          </Text>

          <View style={styles.roleGroup}>
            {ROLES.map((r) => {
              const selected = role === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.roleCard, selected && styles.roleSelected]}
                  onPress={() => setRole(r.key)}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <View style={[styles.roleIcon, selected && styles.roleIconSelected]}>
                    <Ionicons
                      name={r.icon}
                      size={20}
                      color={selected ? Palette.white : Palette.ink[500]}
                    />
                  </View>
                  <View style={styles.roleText}>
                    <Text style={Type.bodyStrong}>{r.name}</Text>
                    <Text style={Type.caption}>{r.desc}</Text>
                  </View>
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={selected ? Palette.brand[600] : Palette.ink[200]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <Button label="Continue" onPress={handleContinue} loading={loading} />
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: Palette.overlay },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Space.xl },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    padding: Space['2xl'],
    ...Shadow[3],
  },
  cardSubtitle: { marginTop: Space.xs, marginBottom: Space.xl },
  roleGroup: { gap: Space.md, marginBottom: Space['2xl'] },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    padding: Space.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Palette.ink[200],
    backgroundColor: Palette.surface,
  },
  roleSelected: { borderColor: Palette.brand[600], backgroundColor: Palette.brand[50] },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Palette.ink[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconSelected: { backgroundColor: Palette.brand[600] },
  roleText: { flex: 1, gap: 2 },
});
