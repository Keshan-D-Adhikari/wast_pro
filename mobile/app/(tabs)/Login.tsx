import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { Image } from 'expo-image';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  /* ================= LOGIN FUNCTION ================= */
  const handleLogin = async () => {
    try {
      const res = await fetch('http://172.20.10.4:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.msg || 'Login failed');
        return;
      }

      // ✅ SUCCESS
      alert('Login Success');
      console.log('LOGIN RESPONSE:', data);

      // TODO (next steps):
      // 1. Save token (AsyncStorage)
      // 2. Redirect based on role
      // if (data.user.role === 'seller') router.push('/seller');
      // else router.push('/buyer');

    } catch (error) {
      console.log(error);
      alert('Server not reachable');
    }
  };

  /* ================= UI ================= */
  return (
    <ImageBackground
      source={require('../../assets/images/back2.png')}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Overlay */}
      <View style={styles.overlay}>

        {/* Logo */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.appName}>SmartWaste Pro</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Log in to continue managing waste sustainably
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#6B7280"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#6B7280"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity>
            <Text style={styles.forgot}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
          >
            <Text style={styles.loginText}>Log In</Text>
          </TouchableOpacity>

          {/* Create Account */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don’t have an account?</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/CreateAccount')}
            >
              <Text style={styles.signupLink}> Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </ImageBackground>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 61, 35, 0.55)',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#F5F9F4',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1E7D6',
  },
  forgot: {
    color: '#4F772D',
    textAlign: 'right',
    marginBottom: 20,
    fontSize: 13,
    fontWeight: '500',
  },
  loginBtn: {
    backgroundColor: '#4F772D',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  signupText: {
    color: '#6B7280',
    fontSize: 13,
  },
  signupLink: {
    color: '#4F772D',
    fontSize: 13,
    fontWeight: '600',
  },
});
