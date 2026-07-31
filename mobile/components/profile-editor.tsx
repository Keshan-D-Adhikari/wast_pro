import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setName(data.fullName || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
          setLocation(data.location || '');
          if (data.photoURL) setPhotoURL(data.photoURL);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

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
      const blob: any = await new Promise((resolve, reject) => {
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

      // Close blob
      if (blob.close) blob.close();

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Save to Firestore
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { photoURL: downloadURL });

      setPhotoURL(downloadURL);
      Alert.alert('Success', 'Profile photo updated! ✨');
    } catch (error: any) {
      console.error('Upload error:', error.code, error.message);
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        fullName: name,
        phone: phone,
        location: location,
        updatedAt: serverTimestamp(),
      });
      Alert.alert(
        'Success',
        isBuyer
          ? 'Buyer profile details have been updated! ✅'
          : 'Your profile details have been updated! ✅'
      );
      router.back();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update profile: ' + error.message);
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
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TextField
          label="Location / Address"
          icon="location-outline"
          value={location}
          onChangeText={setLocation}
        />

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
});
