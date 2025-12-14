import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function CreateAccount() {
  const [role, setRole] = useState<'seller' | 'buyer'>('seller');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>

          {/* Progress */}
          <View style={styles.progressBg}>
            <View style={styles.progressFill} />
          </View>

          <Text style={styles.title}>Create Your Account</Text>

          {/* Inputs */}
          <View style={styles.inputBox}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputBox}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
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
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <Text style={styles.roleTitle}>I am a...</Text>

          {/* Seller */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              role === 'seller' && styles.roleSelected,
            ]}
            onPress={() => setRole('seller')}
          >
            <Ionicons name="trash-outline" size={22} color="#4F772D" />
            <View style={styles.roleText}>
              <Text style={styles.roleName}>Seller</Text>
              <Text style={styles.roleDesc}>
                Monitor bins & sell recyclables
              </Text>
            </View>
          </TouchableOpacity>

          {/* Buyer */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              role === 'buyer' && styles.roleSelected,
            ]}
            onPress={() => setRole('buyer')}
          >
            <Ionicons name="repeat-outline" size={22} color="#4F772D" />
            <View style={styles.roleText}>
              <Text style={styles.roleName}>Buyer</Text>
              <Text style={styles.roleDesc}>
                Purchase recyclable materials
              </Text>
            </View>
          </TouchableOpacity>

          {/* Continue */}
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#EEF2F3',
  },

  /* 🔑 CENTER MAGIC HERE */
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',   // ⬅️ vertical center
    alignItems: 'center',       // ⬅️ horizontal center
    paddingVertical: 24,
  },

  card: {
    width: '86%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },

  progressBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressFill: {
    width: '55%',
    height: '100%',
    backgroundColor: '#4F772D',
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 14,
    color: '#111827',
  },

  inputBox: {
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
  },

  roleTitle: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },

  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  roleSelected: {
    borderColor: '#4F772D',
    backgroundColor: '#E8F5E9',
  },

  roleText: {
    marginLeft: 10,
    flex: 1,
  },
  roleName: {
    fontSize: 15,
    fontWeight: '600',
  },
  roleDesc: {
    fontSize: 12,
    color: '#6B7280',
  },

  button: {
    backgroundColor: '#4F772D',
    paddingVertical: 12,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
