import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useState } from 'react';
import { useRouter } from 'expo-router';

// firebase import
import { auth, db } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function Login() {
  const router = useRouter();

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
        Alert.alert("Success", `Welcome back, ${userData.fullName}!`);

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
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
          />
          <Text style={styles.appName}>SmartWaste Pro</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>Log In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/CreateAccount' as any)}
          >
            <Text style={styles.signup}>
              Don’t have an account? <Text style={{fontWeight: 'bold'}}>Create Account</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,61,35,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  header: { alignItems: 'center', marginBottom: 30 },
  logo: { width: 60, height: 60 },
  appName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#111827'
  },
  input: {
    backgroundColor: '#f1f5f2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    color: '#333'
  },
  loginBtn: {
    backgroundColor: '#4F772D',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10
  },
  loginText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  signup: {
    textAlign: 'center',
    marginTop: 20,
    color: '#4F772D',
  },
});