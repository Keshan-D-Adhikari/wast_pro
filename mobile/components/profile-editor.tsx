import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL, StorageError } from 'firebase/storage';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db, auth, storage } from '../firebaseConfig';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { Palette, Space, Radius, Type } from '@/constants/design';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';

const SRI_LANKAN_LOCATIONS = [
  'Colombo', 'Colombo 01 – Fort', 'Colombo 02 – Slave Island', 'Colombo 03 – Kollupitiya',
  'Colombo 04 – Bambalapitiya', 'Colombo 05 – Havelock Town', 'Colombo 06 – Wellawatte',
  'Colombo 07 – Cinnamon Gardens', 'Colombo 08 – Borella', 'Colombo 09 – Dematagoda',
  'Colombo 10 – Maradana', 'Colombo 12 – Hulftsdorp', 'Colombo 13 – Kotahena',
  'Colombo 14 – Grandpass', 'Colombo 15 – Mattakkuliya', 'Dehiwala-Mount Lavinia',
  'Sri Jayawardenepura Kotte', 'Moratuwa', 'Negombo', 'Wattala', 'Maharagama', 'Nugegoda',
  'Kaduwela', 'Homagama', 'Piliyandala', 'Panadura', 'Kalutara', 'Kandy', 'Peradeniya',
  'Katugastota', 'Kundasale', 'Gampola', 'Nuwara Eliya', 'Hatton', 'Matale', 'Galle',
  'Matara', 'Hambantota', 'Hikkaduwa', 'Unawatuna', 'Ambalangoda', 'Jaffna', 'Kilinochchi',
  'Mannar', 'Vavuniya', 'Trincomalee', 'Batticaloa', 'Ampara', 'Kalmunai', 'Kurunegala',
  'Puttalam', 'Chilaw', 'Kuliyapitiya', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Bandarawela', 'Ella', 'Monaragala', 'Ratnapura', 'Kegalle'
];

const normalizePhone = (p: string) => {
  let cleaned = p.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('07')) {
    cleaned = '+94' + cleaned.slice(1);
  } else if (cleaned.startsWith('94')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
};

const formatSriLankanPhone = (value: string) => {
  let cleaned = value.replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('07')) {
    cleaned = '+94' + cleaned.slice(1);
  } else if (cleaned.startsWith('94')) {
    cleaned = '+' + cleaned;
  }
  
  if (cleaned.startsWith('+94')) {
    const country = cleaned.slice(0, 3);
    const network = cleaned.slice(3, 5);
    const mid = cleaned.slice(5, 8);
    const end = cleaned.slice(8, 12);
    
    let formatted = country;
    if (network) formatted += ' ' + network;
    if (mid) formatted += ' ' + mid;
    if (end) formatted += ' ' + end;
    
    return formatted.trim();
  }
  return cleaned;
};

/**
 * Shared profile editor for both roles. The seller and buyer routes render this
 * with a different `variant`; only the name label and success copy differ.
 */
export function ProfileEditor({ variant }: { variant: 'seller' | 'buyer' }) {
  const router = useRouter();
  const isBuyer = variant === 'buyer';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setName(data.fullName || '');
          setEmail(data.email || '');
          setPhone(data.phone ? formatSriLankanPhone(data.phone) : '');
          setLocation(data.location || '');
          if (data.photoURL) setPhotoURL(data.photoURL);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

  const handlePhoneChange = (text: string) => {
    setPhone(formatSriLankanPhone(text));
    setPhoneError('');
  };

  const handleLocationChange = (text: string) => {
    setLocation(text);
    setShowSuggestions(true);
  };

  const suggestions = location.trim().length > 0
    ? SRI_LANKAN_LOCATIONS.filter(loc => loc.toLowerCase().includes(location.trim().toLowerCase())).slice(0, 6)
    : [];

  const handlePickImage = async () => {
    Alert.alert('Profile Photo', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera access is required');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled) {
            await uploadImage(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Gallery access is required');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled) {
            await uploadImage(result.assets[0].uri);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const uploadImage = async (uri: string) => {
    if (!auth.currentUser) return;
    try {
      setUploading(true);

      const storageRef = ref(storage, 'profilePhotos/' + auth.currentUser.uid + '.jpg');

      // Convert to blob using XMLHttpRequest — fetch() does not handle
      // file:// URIs reliably in React Native
      const blob = await new Promise<Blob>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function () {
          reject(new TypeError('Network request failed'));
        };
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
      });

      // Upload blob to Firebase Storage
      const snapshot = await uploadBytes(storageRef, blob);

      // Close blob — React Native's Blob polyfill exposes this to free
      // resources; it's not part of the standard Blob type.
      (blob as unknown as { close?: () => void }).close?.();

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Save to Firestore
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { photoURL: downloadURL });

      setPhotoURL(downloadURL);
      Alert.alert('Success', 'Profile photo updated! ✨');
    } catch (error: unknown) {
      const message = error instanceof StorageError ? error.message : 'Please try again.';
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    
    let normalizedPhone = '';
    if (phone.trim()) {
      normalizedPhone = normalizePhone(phone);
      const regex = /^\+947\d{8}$/;
      if (!regex.test(normalizedPhone)) {
        setPhoneError('Please enter a valid Sri Lankan mobile number (e.g. 0712345678)');
        return;
      }
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        fullName: name,
        phone: normalizedPhone,
        location: location.trim(),
        updatedAt: serverTimestamp(),
      });
      Alert.alert(
        'Success',
        isBuyer
          ? 'Buyer profile details have been updated! ✅'
          : 'Your profile details have been updated! ✅'
      );
      router.back();
    } catch (error: unknown) {
      Alert.alert('Error', 'Failed to update profile: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Edit profile" back />

      <TouchableOpacity
        onPress={handlePickImage}
        style={styles.avatarWrap}
        activeOpacity={0.8}
        accessibilityLabel="Change profile photo"
      >
        <View style={styles.avatar}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text>
          )}
        </View>
        <View style={styles.cameraBadge}>
          {uploading ? (
            <ActivityIndicator size="small" color={Palette.white} />
          ) : (
            <Ionicons name="camera" size={15} color={Palette.white} />
          )}
        </View>
      </TouchableOpacity>
      <Text style={styles.avatarHint}>Tap to change photo</Text>

      <Card>
        <TextField
          label={isBuyer ? 'Company / Full Name' : 'Full Name'}
          icon={isBuyer ? 'business-outline' : 'person-outline'}
          value={name}
          onChangeText={setName}
        />

        <TextField
          label="Email Address"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextField
          label="Phone Number"
          icon="call-outline"
          value={phone}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
          error={phoneError}
        />

        <View style={{ zIndex: 1 }}>
          <TextField
            label="Location / Address"
            icon="location-outline"
            value={location}
            onChangeText={handleLocationChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay hiding to allow tap on suggestion to register
              setTimeout(() => setShowSuggestions(false), 200);
            }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <Card style={styles.suggestionsCard} elevation={2}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.suggestionItem, i < suggestions.length - 1 && styles.suggestionBorder]}
                  onPress={() => {
                    setLocation(s);
                    setShowSuggestions(false);
                  }}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={Type.body}>{s}</Text>
                </TouchableOpacity>
              ))}
            </Card>
          )}
        </View>

        <Button label="Save changes" onPress={handleSave} loading={loading} />
      </Card>
    </Screen>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  avatarWrap: { alignSelf: 'center', position: 'relative' },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Palette.brand[200],
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 36, fontWeight: '800', color: Palette.brand[600] },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Palette.background,
  },
  avatarHint: {
    ...Type.caption,
    textAlign: 'center',
    marginTop: Space.md,
    marginBottom: Space['2xl'],
  },
  suggestionsCard: {
    position: 'absolute',
    top: 70, // Just below TextField (which is ~52px tall + label)
    left: 0,
    right: 0,
    padding: 0,
    zIndex: 10,
  },
  suggestionItem: {
    padding: Space.lg,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.ink[100],
  },
});
