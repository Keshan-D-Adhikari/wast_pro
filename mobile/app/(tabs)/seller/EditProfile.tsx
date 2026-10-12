// SELLER EDIT PROFILE SCREEN
// Opened from SellerProfile ("Edit profile"). The seller changes their name, phone,
// address and photo here.
// This file is only a thin wrapper. All the form logic lives in the shared
// components/profile-editor.tsx, which is also used by the buyer. The "seller"
// variant only changes small texts (labels and success message).
// The editor reads and updates the Firestore document users/{uid}.
import { ProfileEditor } from '@/components/profile-editor';

// The screen component. expo-router shows it because the file sits in the app/ folder.
// It just renders the shared editor in seller mode.
export default function SellerEditProfile() {
  return <ProfileEditor variant="seller" />;
}
