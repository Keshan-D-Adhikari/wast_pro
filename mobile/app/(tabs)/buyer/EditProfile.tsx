// EditProfile (buyer): the route for the buyer's "Edit profile" screen.
// It only shows the shared ProfileEditor component with variant "buyer".
// All the real work (form, photo upload, saving to the users document) is in
// components/profile-editor.tsx, which the seller uses too.
import { ProfileEditor } from '@/components/profile-editor';

export default function BuyerEditProfile() {
  return <ProfileEditor variant="buyer" />;
}
