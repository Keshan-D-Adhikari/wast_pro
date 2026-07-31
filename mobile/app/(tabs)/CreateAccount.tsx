import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ⬅️ Importing Firebase Tools
// This is where you connect to Firebase via the Keys in firebaseConfig.js.
import { auth, db } from '../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { Palette, Space, Radius, Shadow, Type } from '@/constants/design';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';

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

export default function CreateAccount() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role>('seller');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  // ⬅️ The main function of registration
  const handleContinue = async () => {
    // 1. Basic Validation (check if empty)
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields!");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    setLoading(true); // To show the spinning wheel on the button

    try {
      // 2.Creating a User via Firebase Authentication
      // This will take your email to the Firebase 'Users' tab.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Saving additional user details in the Firestore Database
      //A new document named user.uid is created inside the 'users' collection.
      await setDoc(doc(db, "users", user.uid), {
        fullName: name,
        email: email,
        role: role,
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Success 🎉", "Account created successfully!");

      // 4. Sending to the relevant Dashboard according to the role
      if (role === 'seller') {
        router.replace('/(tabs)/seller/SellerDashboard' as any);
      } else {
        router.replace('/(tabs)/buyer/BuyerDashboard' as any);
      }
    } catch (error: any) {
      // If something goes wrong (e.g. if the email has been used before), an error will be displayed.
      Alert.alert("Registration Failed", error.message);
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

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + Space.xl, paddingBottom: insets.bottom + Space['3xl'] },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={Palette.white} />
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={Type.h1}>Create your account</Text>
            <Text style={[Type.small, styles.cardSubtitle]}>
              Choose how you’ll use SmartWaste Pro
            </Text>

            {/* Role Selection — moved above the form so the labels below make sense */}
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

            <TextField
              label={role === 'buyer' ? 'Company / Full Name' : 'Full Name'}
              icon={role === 'buyer' ? 'business-outline' : 'person-outline'}
              placeholder="Your full name"
              value={name}
              onChangeText={setName}
            />

            <TextField
              label="Email Address"
              icon="mail-outline"
              placeholder="email@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextField
              label="Password"
              icon="lock-closed-outline"
              placeholder="At least 6 characters"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />

            <TextField
              label="Confirm Password"
              icon="lock-closed-outline"
              placeholder="Re-enter your password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
              error={mismatch ? 'Passwords do not match' : undefined}
            />

            <Button label="Create Account" onPress={handleContinue} loading={loading} />

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/Login' as any)}
              style={styles.loginRow}
              hitSlop={8}
            >
              <Text style={Type.small}>
                Already registered? <Text style={styles.loginLink}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  background: { flex: 1 },
  flex: { flex: 1 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: Palette.overlay },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Space.xl },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.lg,
  },
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
  loginRow: { alignItems: 'center', marginTop: Space.xl },
  loginLink: { ...Type.smallStrong, color: Palette.brand[600], fontWeight: '700' },
});
