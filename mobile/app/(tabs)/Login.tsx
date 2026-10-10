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
import { FirebaseError } from 'firebase/app';
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { Palette, Space, Radius, Shadow, Type } from '@/constants/design';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { passwordResetMessage } from '../../utils/passwordReset';

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  /* ================= FIREBASE LOGIN FUNCTION ================= */
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      // 1. Login via Firebase Auth (Server unreachable error does not appear here)
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Reading this User's Role (Seller/Buyer) from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = userData.role;

        // An admin can flag an account as disabled (see admin/src/pages/Users.jsx);
        // block the sign-in here rather than only hiding it in the admin UI.
        if (userData.disabled) {
          await signOut(auth);
          Alert.alert('Account disabled', 'This account has been disabled. Contact an administrator.');
          return;
        }

        // 3. Sending to the relevant Dashboard according to the role
        if (userRole === 'seller') {
          router.replace('/(tabs)/seller/SellerDashboard');
        } else {
          router.replace('/(tabs)/buyer/BuyerDashboard');
        }
      } else {
        Alert.alert("Error", "User details not found in Firestore. Please register again.");
      }

    } catch (err: unknown) {
      console.warn('Login error:', err instanceof FirebaseError ? err.code : err);
      // The error that appears if you provide incorrect details.
      Alert.alert('Login Failed', 'Invalid email or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  /* ================= PASSWORD RESET ================= */
  const handleForgotPassword = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Enter your email', 'Type your email address above, then tap "Forgot password?" again.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, trimmed);
      const { text } = passwordResetMessage();
      Alert.alert('Check your email', text);
    } catch (err: unknown) {
      const code = err instanceof FirebaseError ? err.code : undefined;
      console.warn('Password reset error:', code ?? err);
      const { ok, text } = passwordResetMessage(code ?? 'unknown');
      Alert.alert(ok ? 'Check your email' : 'Could not send email', text);
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
              passwordToggle
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />

            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotRow}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
            >
              <Text style={styles.signupLink}>Forgot password?</Text>
            </TouchableOpacity>

            <Button label="Log In" onPress={handleLogin} loading={loading} />

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/CreateAccount')}
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
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: Palette.overlay },
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
  forgotRow: { alignSelf: 'flex-end', marginBottom: Space.lg },
  signupRow: { alignItems: 'center', marginTop: Space.xl },
  signupLink: { ...Type.smallStrong, color: Palette.brand[600], fontWeight: '700' },
});
