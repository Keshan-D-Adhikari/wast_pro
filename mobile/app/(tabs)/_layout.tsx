// LAYOUT FOR THE "(tabs)" FOLDER
// Despite the name, this is NOT a tab bar. It is a plain Stack navigator that
// wraps every screen inside the (tabs) folder (Splash, Welcome, Login,
// CreateAccount, and the seller and buyer screens).
// The folder name in brackets is an Expo Router "route group": it organises files
// but does not appear in the URL.
import { Stack } from 'expo-router';

// Expo Router uses the default export as the layout for all screens in this folder.
export default function TabLayout() {
  return (
    // Stack: each new screen is pushed on top of the previous one.
    <Stack
      screenOptions={{
        // Screens draw their own header, so hide the built-in one.
        headerShown: false,
        gestureEnabled: true,             // ⬅️ Turning on Swipe
        gestureDirection: 'horizontal',   // ⬅️ Let me pull you across.
        animation: 'slide_from_right',    // ⬅️ A beautiful animation is coming.
      }}
    />
  );
}
