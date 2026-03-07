import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,             // ⬅️ Swipe එක On කරනවා
        gestureDirection: 'horizontal',   // ⬅️ හරහට අදින්න දෙනවා
        animation: 'slide_from_right',    // ⬅️ ලස්සනට Animation එකක් එනවා
      }}
    />
  );
}