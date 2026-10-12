// ROOT LAYOUT
// This is the first component Expo Router renders. Every screen in the app is
// shown inside it. It sets up things that must exist for the whole app:
//   - safe-area handling (so content does not hide under the notch or home bar)
//   - the navigation theme (background colour)
//   - the main Stack navigator (screens slide in from the right)
// The real screens live in the "(tabs)" folder next to this file.
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// This import has no name on purpose. It only needs to run once at startup so that
// the Reanimated animation library is ready before any screen uses it.
import 'react-native-reanimated';

import { Palette } from '@/constants/design';

// Expo Router setting: "anchor" is the route used as the base of the navigation
// history. It makes sure the "(tabs)" group is always at the bottom of the stack.
export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * The app is designed light-only around the brand green, so pin the navigation
 * theme's background to our own token rather than following the OS colour
 * scheme — a dark system theme used to flash a black background between screens.
 */
// We copy DefaultTheme with the spread operator (...) and then replace only the
// background colour. Everything else in the theme stays the same.
const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Palette.background },
};

// The root component. Expo Router uses the default export of _layout.tsx as the
// wrapper for all child routes.
export default function RootLayout() {
  return (
    // SafeAreaProvider lets any screen ask "how big are the notch / home bar?"
    // (used with useSafeAreaInsets in the screens).
    <SafeAreaProvider>
      {/* ThemeProvider gives the navigation theme (with our background) to all screens */}
      <ThemeProvider value={navTheme}>
        {/* Stack = screens are stacked on top of each other, like a pile of cards */}
        <Stack
          screenOptions={{
            // No default top bar; each screen draws its own header.
            headerShown: false,
            // Allow swiping from the left edge to go back.
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            // New screens slide in from the right.
            animation: 'slide_from_right',
            // Background shown behind each screen while it moves.
            contentStyle: { backgroundColor: Palette.background },
          }}
        >
          {/* Register the "(tabs)" folder as one screen group inside this stack */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        {/* Dark status bar icons (clock, battery) because our background is light */}
        <StatusBar style="dark" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
