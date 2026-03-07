import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CreateAccount() {
  const router = useRouter();

  const [role, setRole] = useState<'seller' | 'buyer'>('seller');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleContinue = () => {
    if (role === 'seller') {
      router.push('/(tabs)/seller/SellerProfile' as any);
    } else if (role === 'buyer') {
      router.push('/(tabs)/buyer/BuyerProfile' as any);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/back2.png')} // Login එකේ වගේම Background එකක්
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safe}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <View style={styles.progressBg}>
                <View style={styles.progressFill} />
              </View>

              <Text style={styles.title}>Create Your Account</Text>

              <View style={styles.inputBox}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your full name"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Create a secure password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <Text style={styles.roleTitle}>I am a...</Text>

              <TouchableOpacity
                style={[styles.roleCard, role === 'seller' && styles.roleSelected]}
                onPress={() => setRole('seller')}
              >
                <Ionicons name="trash-outline" size={22} color={role === 'seller' ? "#4F772D" : "#6B7280"} />
                <View style={styles.roleText}>
                  <Text style={[styles.roleName, role === 'seller' && { color: "#4F772D" }]}>Seller</Text>
                  <Text style={styles.roleDesc}>Monitor bins & sell recyclables</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleCard, role === 'buyer' && styles.roleSelected]}
                onPress={() => setRole('buyer')}
              >
                <Ionicons name="repeat-outline" size={22} color={role === 'buyer' ? "#4F772D" : "#6B7280"} />
                <View style={styles.roleText}>
                  <Text style={[styles.roleName, role === 'buyer' && { color: "#4F772D" }]}>Buyer</Text>
                  <Text style={styles.roleDesc}>Purchase recyclable materials</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={handleContinue}>
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,61,35,0.65)', // Dark transparent overlay
  },
  safe: { 
    flex: 1, 
  },
  scroll: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 24 
  },
  card: { 
    width: '90%', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    padding: 20, 
    shadowColor: '#000', 
    shadowOpacity: 0.2, 
    shadowRadius: 15, 
    elevation: 8 
  },
  progressBg: { 
    height: 6, 
    backgroundColor: '#E5E7EB', 
    borderRadius: 10, 
    marginBottom: 20, 
    overflow: 'hidden' 
  },
  progressFill: { 
    width: '55%', 
    height: '100%', 
    backgroundColor: '#4F772D' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    marginBottom: 20, 
    color: '#111827',
    textAlign: 'center'
  },
  inputBox: { 
    marginBottom: 12 
  },
  label: { 
    fontSize: 13, 
    fontWeight: '600', 
    marginBottom: 6,
    color: '#374151'
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#D1D5DB', 
    backgroundColor: '#F9FAFB',
    borderRadius: 12, 
    paddingVertical: 12, 
    paddingHorizontal: 14, 
    fontSize: 14,
    color: '#111827'
  },
  roleTitle: { 
    marginTop: 10, 
    marginBottom: 10, 
    fontSize: 15, 
    fontWeight: '700',
    color: '#374151'
  },
  roleCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: '#E5E7EB', 
    borderRadius: 14, 
    padding: 14, 
    marginBottom: 10,
    backgroundColor: '#FFFFFF'
  },
  roleSelected: { 
    borderColor: '#4F772D', 
    backgroundColor: '#F4F9F4' 
  },
  roleText: { 
    marginLeft: 12, 
    flex: 1 
  },
  roleName: { 
    fontSize: 16, 
    fontWeight: '700',
    color: '#4B5563'
  },
  roleDesc: { 
    fontSize: 12, 
    color: '#6B7280',
    marginTop: 2
  },
  button: { 
    backgroundColor: '#4F772D', 
    paddingVertical: 15, 
    borderRadius: 30, 
    alignItems: 'center', 
    marginTop: 15,
    shadowColor: '#4F772D',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});