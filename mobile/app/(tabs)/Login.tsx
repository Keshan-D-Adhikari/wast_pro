import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// firebase import
import { auth, db } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { Palette, Space, Radius, Shadow, Type } from '@/constants/design';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= FIREBASE LOGIN FUNCTION ================= */
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting Firebase Login...');

      // 1. Login via Firebase Auth (Server unreachable error does not appear here)
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('Login Auth Success:', user.uid);

      // 2. Reading this User's Role (Seller/Buyer) from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = userData.role;

        console.log('User Role found:', userRole);

        // 3. Sending to the relevant Dashboard according to the role
        if (userRole === 'seller') {
          router.replace('/(tabs)/seller/SellerDashboard' as any);
        } else {
          router.replace('/(tabs)/buyer/BuyerDashboard' as any);
        }
      } else {
        Alert.alert("Error", "User details not found in Firestore. Please register again.");
      }

    } catch (err: any) {
      console.log('Login Error:', err.code);
      // The error that appears if you provide incorrect details.
      Alert.alert('Login Failed', 'Invalid email or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
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
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + Space['3xl'], paddingBottom: insets.bottom + Space['3xl'] },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <View style={styles.logoBadge}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
            <Text style={styles.appName}>SmartWaste Pro</Text>
          </View>

          <View style={styles.card}>
            <Text style={Type.h1}>Welcome back</Text>
            <Text style={[Type.small, styles.cardSubtitle]}>
              Sign in to your seller or buyer account
            </Text>

            <TextField
              label="Email"
              icon="mail-outline"
              placeholder="email@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
            />

            <TextField
              label="Password"
              icon="lock-closed-outline"
              placeholder="Your password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />

            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              style={styles.toggle}
              hitSlop={8}
            >
              <Text style={styles.toggleText}>
                {showPassword ? 'Hide password' : 'Show password'}
              </Text>
            </TouchableOpacity>

            <Button label="Log In" onPress={handleLogin} loading={loading} />

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/CreateAccount' as any)}
              style={styles.signupRow}
              hitSlop={8}
            >
              <Text style={Type.small}>
                Don’t have an account? <Text style={styles.signupLink}>Create one</Text>
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
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Space['2xl'] },
  brand: { alignItems: 'center', marginBottom: Space['3xl'] },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.md,
    ...Shadow[2],
  },
  logo: { width: 40, height: 40 },
  appName: { ...Type.h3, color: Palette.white, letterSpacing: 0.3 },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    padding: Space['2xl'],
    ...Shadow[3],
  },
  cardSubtitle: { marginTop: Space.xs, marginBottom: Space['2xl'] },
  toggle: { alignSelf: 'flex-end', marginTop: -Space.sm, marginBottom: Space.xl },
  toggleText: { ...Type.caption, color: Palette.brand[600] },
  signupRow: { alignItems: 'center', marginTop: Space.xl },
  signupLink: { ...Type.smallStrong, color: Palette.brand[600], fontWeight: '700' },
});
