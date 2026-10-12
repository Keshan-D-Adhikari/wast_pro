// CREATE ACCOUNT SCREEN (route "/CreateAccount")
// The registration form. The user picks a role (Seller or Buyer), types name,
// email and password, and taps "Create Account". We then:
//   1. create the login in Firebase Authentication, and
//   2. save the profile (name, role...) in Firestore, in the "users" collection.
// Finally the user is sent to the dashboard for their role.
// Flow: Login -> CreateAccount -> SellerDashboard or BuyerDashboard
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

// A TypeScript "union type": a Role can only be one of these two words.
type Role = 'seller' | 'buyer';

// The two role cards shown on screen. "key" is the value saved in Firestore.
// The rest (icon, name, desc) is only for display.
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

  // Screen state. Each useState keeps one value; React redraws the screen when it changes.
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role>('seller'); // seller is selected by default
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // A value worked out from state on every render. True when the user has started
  // typing the confirm box and it does not match. It shows the red error text.
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
      // Firebase also signs the new user in automatically. It rejects weak
      // passwords (under 6 characters) and emails that are already used.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Saving additional user details in the Firestore Database
      //A new document named user.uid is created inside the 'users' collection.
      // Auth cannot store a role, so we keep it here. Login reads it later to choose
      // the dashboard. Using the uid as the document id links this profile to the login.
      await setDoc(doc(db, "users", user.uid), {
        fullName: name,
        email: email,
        role: role,
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Success 🎉", "Account created successfully!");

      // 4. Sending to the relevant Dashboard according to the role
      // replace removes this form from the history, so Back will not show it again.
      if (role === 'seller') {
        router.replace('/(tabs)/seller/SellerDashboard');
      } else {
        router.replace('/(tabs)/buyer/BuyerDashboard');
      }
    } catch (error: unknown) {
      // If something goes wrong (e.g. if the email has been used before), an error will be displayed.
      Alert.alert("Registration Failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      // Always stop the spinner, whether it worked or failed.
      setLoading(false);
    }
  };

  return (
    // Background photo with a dark overlay (scrim) so the white card stands out
    <ImageBackground
      source={require('../../assets/images/back2.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.scrim} />

      {/* On iOS, push the content up when the keyboard opens */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Scrollable form. "handled" lets buttons work while the keyboard is open. */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + Space.xl, paddingBottom: insets.bottom + Space['3xl'] },
          ]}
        >
          {/* Back arrow: router.back() returns to the previous screen (Login) */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={Palette.white} />
          </TouchableOpacity>

          {/* White form card */}
          <View style={styles.card}>
            <Text style={Type.h1}>Create your account</Text>
            <Text style={[Type.small, styles.cardSubtitle]}>
              Choose how you’ll use SmartWaste Pro
            </Text>

            {/* Role Selection — moved above the form so the labels below make sense */}
            <View style={styles.roleGroup}>
              {/* One card per role. Tapping a card saves its key in the "role" state. */}
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
                    {/* Role icon */}
                    <View style={[styles.roleIcon, selected && styles.roleIconSelected]}>
                      <Ionicons
                        name={r.icon}
                        size={20}
                        color={selected ? Palette.white : Palette.ink[500]}
                      />
                    </View>
                    {/* Role name and description */}
                    <View style={styles.roleText}>
                      <Text style={Type.bodyStrong}>{r.name}</Text>
                      <Text style={Type.caption}>{r.desc}</Text>
                    </View>
                    {/* Radio circle, filled when this role is selected */}
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={selected ? Palette.brand[600] : Palette.ink[200]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Name input. Buyers are often companies, so the label changes for them. */}
            <TextField
              label={role === 'buyer' ? 'Company / Full Name' : 'Full Name'}
              icon={role === 'buyer' ? 'business-outline' : 'person-outline'}
              placeholder="Your full name"
              value={name}
              onChangeText={setName}
            />

            {/* Email input */}
            <TextField
              label="Email Address"
              icon="mail-outline"
              placeholder="email@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password input (with show/hide eye) */}
            <TextField
              label="Password"
              icon="lock-closed-outline"
              placeholder="At least 6 characters"
              passwordToggle
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />

            {/* Confirm password. Shows an error under the box while the two do not match. */}
            <TextField
              label="Confirm Password"
              icon="lock-closed-outline"
              placeholder="Re-enter your password"
              passwordToggle
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
              error={mismatch ? 'Passwords do not match' : undefined}
            />

            {/* Submit button. It shows a spinner while loading is true. */}
            <Button label="Create Account" onPress={handleContinue} loading={loading} />

            {/* For people who already have an account */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/Login')}
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
  // Full-screen background, keyboard wrapper, dark overlay and scroll area
  background: { flex: 1 },
  flex: { flex: 1 },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: Palette.overlay },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Space.xl },
  // Round back button at the top left
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.lg,
  },
  // White card that holds the form
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    padding: Space['2xl'],
    ...Shadow[3],
  },
  cardSubtitle: { marginTop: Space.xs, marginBottom: Space.xl },
  // Role cards: normal look, selected look (green border), and their icon boxes
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
  // "Already registered? Log in" link
  loginRow: { alignItems: 'center', marginTop: Space.xl },
  loginLink: { ...Type.smallStrong, color: Palette.brand[600], fontWeight: '700' },
});
