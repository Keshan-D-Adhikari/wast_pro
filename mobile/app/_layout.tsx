import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { Palette } from '@/constants/design';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * The app is designed light-only around the brand green, so pin the navigation
 * theme's background to our own token rather than following the OS colour
 * scheme — a dark system theme used to flash a black background between screens.
 */
const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Palette.background },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={navTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: Palette.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}