import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔥 ANDROID EMULATOR → 10.0.2.2
  const BASE_URL = 'http://10.0.2.2:5000';

  /* ================= LOGIN FUNCTION ================= */
  const handleLogin = async () => {
    try {
      setLoading(true);

      console.log('Sending request...');

      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      console.log('Response:', data);

      if (!res.ok) {
        alert(data.msg || 'Login failed');
        return;
      }

      // ✅ SAVE TOKEN
      await AsyncStorage.setItem('token', data.token);

      alert('Login Success');

      // ✅ ROLE BASED NAVIGATION
      if (data.user.role === 'seller') {
        router.replace('/(tabs)/seller/SellerDashboard');
      } else {
        router.replace('/(tabs)/buyer/BuyerDashboard');
      }

    } catch (err) {
      console.log(err);
      alert('Server not reachable');
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
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
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
            onPress={() => router.push('/(tabs)/CreateAccount')}
          >
            <Text style={styles.signup}>
              Don’t have an account? Create Account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

/* ================= STYLES ================= */

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
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f1f5f2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  loginBtn: {
    backgroundColor: '#4F772D',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontWeight: '600',
  },
  signup: {
    textAlign: 'center',
    marginTop: 16,
    color: '#4F772D',
  },
});
