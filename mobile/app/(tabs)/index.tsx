// SPLASH SCREEN (route "/")
// The first screen the user sees when the app opens. It fades in the logo and app
// name, waits about 2 seconds, then moves on to the Welcome screen.
// Flow: Splash -> Welcome -> Login -> (Seller or Buyer dashboard)
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Palette, Space, Radius, Shadow, Type } from '@/constants/design';

// The file is named index.tsx, so Expo Router treats it as the home route.
export default function Splash() {
  // useRouter gives us functions to move between screens (push, replace, back).
  const router = useRouter();

  // Gentle fade + rise so the logo settles into place rather than snapping in.
  // Lazy useState init (rather than useRef().current) keeps this out of the
  // render path itself.
  // Animated.Value holds a number that React Native can animate smoothly.
  // "fade" goes from 0 (invisible) to 1 (visible). "rise" goes from 16 pixels
  // below its place up to 0 (its normal place).
  // We only need the value, never a setter, so we read just the first array item.
  const [fade] = useState(() => new Animated.Value(0));
  const [rise] = useState(() => new Animated.Value(16));

  // useEffect runs code AFTER the screen is shown. With a list of dependencies at
  // the end, it runs again only when one of them changes.
  useEffect(() => {
    // 1. Start both animations at the same time (parallel).
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        // useNativeDriver runs the animation on the phone's UI thread, so it stays
        // smooth even if the JavaScript thread is busy.
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. After 2 seconds, go to the Welcome screen.
    // router.replace swaps the current screen instead of adding a new one. So the
    // user cannot press Back and return to the splash screen (push would allow that).
    const timer = setTimeout(() => {
      router.replace('/(tabs)/Welcome');
    }, 2000);

    // 3. Cleanup function: React runs it when the screen closes. It cancels the
    // timer so we never navigate from a screen that is already gone.
    return () => clearTimeout(timer);
  }, [fade, rise, router]);

  return (
    <View style={styles.container}>
      {/* Logo, name and tagline. They fade in and slide up together. */}
      <Animated.View style={[styles.content, { opacity: fade, transform: [{ translateY: rise }] }]}>
        {/* White rounded badge behind the logo */}
        <View style={styles.logoBadge}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
        <Text style={styles.name}>SmartWaste Pro</Text>
        <Text style={styles.tagline}>Smart bins · Smarter recycling</Text>
      </Animated.View>

      {/* Footer text at the bottom, which only fades in */}
      <Animated.Text style={[styles.footer, { opacity: fade }]}>
        Turning waste into value
      </Animated.Text>
    </View>
  );
}

/* ================= STYLES ================= */

// Colours, spacing and fonts come from constants/design so the whole app looks the same.
// Screen: full-height, light green background, content centred.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.brand[50],
    justifyContent: 'center',
    alignItems: 'center',
    padding: Space.xl,
  },
  content: { alignItems: 'center' },
  // Logo badge, logo image, app name and tagline
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: Radius.xl,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.xl,
    ...Shadow[2],
  },
  logo: { width: 56, height: 56 },
  name: { ...Type.h1, fontSize: 32, color: Palette.brand[900] },
  tagline: { ...Type.small, marginTop: Space.sm, color: Palette.brand[600], fontWeight: '600' },
  // Footer text pinned near the bottom edge
  footer: {
    ...Type.caption,
    position: 'absolute',
    bottom: Space['4xl'],
    color: Palette.ink[300],
  },
});
