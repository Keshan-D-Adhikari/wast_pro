import { Stack } from 'expo-router';

// Expo Router uses the default export as the layout for all screens in this folder.
export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,             // ⬅️ Turning on Swipe
        gestureDirection: 'horizontal',   // ⬅️ Let me pull you across.
        animation: 'slide_from_right',    // ⬅️ A beautiful animation is coming.
      }}
    />
  );
}