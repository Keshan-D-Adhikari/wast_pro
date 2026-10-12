// LOGIN SCREEN (route "/Login")
// The user types an email and password. We sign in with Firebase Authentication,
// then read the user's document in Firestore to find their role (seller or buyer)
// and send them to the matching dashboard. Disabled accounts are blocked.
// There is also a "Forgot password?" link and a link to the CreateAccount screen.
// Flow: Welcome -> Login -> SellerDashboard or BuyerDashboard
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
// auth = Firebase Authentication (who you are), db = Firestore (the database).
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

  // useState: values that change while the screen is open. When one changes,
  // React redraws the screen. The second name (setEmail...) is how we change it.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // "loading" is true while we wait for Firebase. The button shows a spinner.
  const [loading, setLoading] = useState(false);

  /* ================= FIREBASE LOGIN FUNCTION ================= */
  // Runs when the user taps "Log In" (or presses "go" on the keyboard).
  // "async" lets us use "await" to wait for Firebase without freezing the app.
  const handleLogin = async () => {
    // Stop early if a field is empty.
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      // 1. Login via Firebase Auth (Server unreachable error does not appear here)
      // This throws an error if the email or password is wrong.
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Reading this User's Role (Seller/Buyer) from Firestore
      // Auth only knows email and password. The role is saved by CreateAccount in
      // the "users" collection, in a document named after the user's uid.
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = userData.role;

        // An admin can flag an account as disabled (see admin/src/pages/Users.jsx);
        // block the sign-in here rather than only hiding it in the admin UI.
        if (userData.disabled) {
          // Log the person out again straight away, then explain why.
          await signOut(auth);
          Alert.alert('Account disabled', 'This account has been disabled. Contact an administrator.');
          return;
        }

        // 3. Sending to the relevant Dashboard according to the role
        // replace (not push) removes Login from the history, so Back will not return here.
        if (userRole === 'seller') {
          router.replace('/(tabs)/seller/SellerDashboard');
        } else {
          router.replace('/(tabs)/buyer/BuyerDashboard');
        }
      } else {
        // The account exists in Auth but has no profile document.
        Alert.alert("Error", "User details not found in Firestore. Please register again.");
      }

    } catch (err: unknown) {
      // Log the Firebase error code for developers (the user does not see it).
      console.warn('Login error:', err instanceof FirebaseError ? err.code : err);
      // The error that appears if you provide incorrect details.
      // One general message is used on purpose, so we do not reveal whether the
      // email exists.
      Alert.alert('Login Failed', 'Invalid email or password. Please check your credentials.');
    } finally {
      // "finally" always runs, on success or error, so the spinner always stops.
      setLoading(false);
    }
  };

  /* ================= PASSWORD RESET ================= */
  // Sends Firebase's "reset your password" email to the address in the email box.
  const handleForgotPassword = async () => {
    // 1. We need an email first.
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Enter your email', 'Type your email address above, then tap "Forgot password?" again.');
      return;
    }
    try {
      // 2. Ask Firebase to send the email.
      await sendPasswordResetEmail(auth, trimmed);
      const { text } = passwordResetMessage();
      Alert.alert('Check your email', text);
    } catch (err: unknown) {
      // 3. On error, passwordResetMessage (utils/passwordReset) turns the Firebase
      // error code into a friendly message.
      const code = err instanceof FirebaseError ? err.code : undefined;
      console.warn('Password reset error:', code ?? err);
      const { ok, text } = passwordResetMessage(code ?? 'unknown');
      Alert.alert(ok ? 'Check your email' : 'Could not send email', text);
    }
  };

  /* ================= UI ================= */
  return (
    // Background photo with a dark overlay (scrim) so the white card stands out
    <ImageBackground
      source={require('../../assets/images/back2.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.scrim} />

      {/* On iOS, move the content up when the keyboard opens so it does not hide the inputs */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ScrollView: lets the form scroll on small screens.
            "handled" means a tap on a button works even while the keyboard is open. */}
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + Space['3xl'], paddingBottom: insets.bottom + Space['3xl'] },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo and app name above the card */}
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

          {/* White login card */}
          <View style={styles.card}>
            <Text style={Type.h1}>Welcome back</Text>
            <Text style={[Type.small, styles.cardSubtitle]}>
              Sign in to your seller or buyer account
            </Text>

            {/* Email input. value + onChangeText keep the box in sync with our state. */}
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

            {/* Password input with a show/hide eye. Pressing "go" on the keyboard logs in. */}
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

            {/* "Forgot password?" link. hitSlop makes the tap area bigger than the text. */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotRow}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
            >
              <Text style={styles.signupLink}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Main login button. It shows a spinner while loading is true. */}
            <Button label="Log In" onPress={handleLogin} loading={loading} />

            {/* Link to the registration screen. push keeps Login underneath, so Back returns here. */}
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
  // Full-screen background, keyboard wrapper and dark overlay
  background: { flex: 1 },
  flex: { flex: 1 },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: Palette.overlay },
  // Scroll area: content is centred vertically and has side padding
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Space['2xl'] },
  // Logo block above the card
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
  // White card that holds the form
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    padding: Space['2xl'],
    ...Shadow[3],
  },
  cardSubtitle: { marginTop: Space.xs, marginBottom: Space['2xl'] },
  // Link rows: "Forgot password?" on the right, "Create one" centred
  forgotRow: { alignSelf: 'flex-end', marginBottom: Space.lg },
  signupRow: { alignItems: 'center', marginTop: Space.xl },
  signupLink: { ...Type.smallStrong, color: Palette.brand[600], fontWeight: '700' },
});
