import { ProfileEditor } from '@/components/profile-editor';

// The screen component. expo-router shows it because the file sits in the app/ folder.
// It just renders the shared editor in seller mode.
export default function SellerEditProfile() {
  return <ProfileEditor variant="seller" />;
}
