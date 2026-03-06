import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function BuyerProfile() {
  const router = useRouter();

  const [image, setImage] = useState<string | null>(null);

  const user = {
    name: 'Keshan',
    email: 'buyer@gmail.com',
    orders: 8,
    total: 'Rs. 22,000',
    rewards: 120,
  };

  /* ================= PICK PROFILE IMAGE ================= */
  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    router.replace('/(tabs)/Login');
  };

  return (
    <ScrollView style={styles.container}>

      {/* ===== HEADER ===== */}
      <View style={styles.header}>
        <TouchableOpacity onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="camera" size={30} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.role}>Buyer Account</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      {/* ===== STATS CARD ===== */}
      <View style={styles.card}>
        <Row label="Orders" value={user.orders} />
        <Row label="Total Purchases" value={user.total} />
        <Row label="Rewards Points" value={user.rewards} />
      </View>

      {/* ===== ACTIONS ===== */}
      <View style={styles.actionCard}>

        <Action
          icon="person-outline"
          title="Edit Profile"
          onPress={() => Alert.alert('Edit profile soon')}
        />

        <Action
          icon="cube-outline"
          title="My Orders"
          onPress={() => Alert.alert('Orders screen')}
        />

        <Action
          icon="lock-closed-outline"
          title="Change Password"
          onPress={() => Alert.alert('Change password')}
        />

        <Action
          icon="log-out-outline"
          title="Logout"
          danger
          onPress={handleLogout}
        />
      </View>

    </ScrollView>
  );
}

/* ================= Row Component ================= */
const Row = ({ label, value }: any) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

/* ================= Action Component ================= */
const Action = ({ icon, title, onPress, danger }: any) => (
  <TouchableOpacity style={styles.action} onPress={onPress}>
    <Ionicons
      name={icon}
      size={20}
      color={danger ? '#D32F2F' : '#4F772D'}
    />
    <Text style={[styles.actionText, danger && { color: '#D32F2F' }]}>
      {title}
    </Text>
  </TouchableOpacity>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F3',
  },

  /* HEADER */
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 60,
    marginBottom: 12,
  },

  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 60,
    backgroundColor: '#4F772D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  name: {
    fontSize: 22,
    fontWeight: '700',
  },

  role: {
    color: '#4F772D',
    fontWeight: '600',
  },

  email: {
    color: '#6B7280',
    marginTop: 4,
  },

  /* STATS CARD */
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 18,
    elevation: 4,
    marginBottom: 18,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  rowLabel: {
    color: '#6B7280',
  },

  rowValue: {
    fontWeight: '600',
  },

  /* ACTION CARD */
  actionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 18,
    paddingVertical: 10,
    elevation: 4,
  },

  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },

  actionText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
  },
});
