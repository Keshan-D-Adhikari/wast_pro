import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ImageBackground, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// ⬅️ Firebase මෙවලම් Import කිරීම
// මෙතනින් තමයි firebaseConfig.js එකේ තියෙන Keys හරහා Firebase එකට connect වෙන්නේ
import { auth, db } from '../../firebaseConfig'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function CreateAccount() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'seller' | 'buyer'>('seller');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ⬅️ Register වීමේ ප්‍රධාන Function එක
  const handleContinue = async () => {
    // 1. Basic Validation (හිස්ව තිබේදැයි බැලීම)
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields!");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    setLoading(true); // බටන් එකේ කැරකෙන රෝදය පෙන්වීමට

    try {
      // 2. Firebase Authentication හරහා User ව සෑදීම
      // මෙයින් ඔයාගේ Email එක Firebase 'Users' ටැබ් එකට යනවා
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Firestore Database එකේ User ගේ අමතර විස්තර සේව් කිරීම
      // 'users' කියන collection එක ඇතුළේ user.uid නමින් අලුත් ලේඛනයක් (document) හැදෙනවා
      await setDoc(doc(db, "users", user.uid), {
        fullName: name,
        email: email,
        role: role,
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Success 🎉", "Account created successfully!");
      
      // 4. Role එක අනුව අදාළ Dashboard එකට යැවීම
      if (role === 'seller') {
        router.push('/(tabs)/seller/SellerProfile' as any);
      } else {
        router.push('/(tabs)/buyer/BuyerProfile' as any);
      }
    } catch (error: any) {
      // මොකක් හරි වැරදුණොත් (උදා: Email එක කලින් පාවිච්චි කරලා නම්) Error එක පෙන්වනවා
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
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safe}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={styles.card}>
              <Text style={styles.title}>Create Your Account</Text>

              {/* Inputs */}
              <View style={styles.inputBox}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput style={styles.input} placeholder="Your full name" value={name} onChangeText={setName}/>
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput style={styles.input} placeholder="email@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.label}>Password</Text>
                <TextInput style={styles.input} placeholder="At least 6 characters" secureTextEntry value={password} onChangeText={setPassword}/>
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput style={styles.input} placeholder="Confirm your password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword}/>
              </View>

              {/* Role Selection */}
              <Text style={styles.roleTitle}>I am a...</Text>
              
              <TouchableOpacity 
                style={[styles.roleCard, role === 'seller' && styles.roleSelected]} 
                onPress={() => setRole('seller')}
              >
                <Ionicons name="trash-outline" size={22} color={role === 'seller' ? "#4F772D" : "#6B7280"} />
                <View style={styles.roleText}>
                  <Text style={styles.roleName}>Seller</Text>
                  <Text style={styles.roleDesc}>Monitor bins & sell recyclables</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.roleCard, role === 'buyer' && styles.roleSelected]} 
                onPress={() => setRole('buyer')}
              >
                <Ionicons name="repeat-outline" size={22} color={role === 'buyer' ? "#4F772D" : "#6B7280"} />
                <View style={styles.roleText}>
                  <Text style={styles.roleName}>Buyer</Text>
                  <Text style={styles.roleDesc}>Purchase recyclable materials</Text>
                </View>
              </TouchableOpacity>

              {/* Submit Button */}
              <TouchableOpacity style={styles.button} onPress={handleContinue} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(15,61,35,0.65)' },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 24 },
  card: { width: '90%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, elevation: 10 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 20, color: '#111827', textAlign: 'center' },
  inputBox: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#374151' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 12, backgroundColor: '#F9FAFB' },
  roleTitle: { marginTop: 10, marginBottom: 10, fontSize: 15, fontWeight: '700', color: '#1F2937' },
  roleCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, padding: 14, marginBottom: 10 },
  roleSelected: { borderColor: '#4F772D', backgroundColor: '#F4F9F4' },
  roleText: { marginLeft: 12, flex: 1 },
  roleName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  roleDesc: { fontSize: 12, color: '#6B7280' },
  button: { backgroundColor: '#4F772D', paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginTop: 15, shadowColor: '#4F772D', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});