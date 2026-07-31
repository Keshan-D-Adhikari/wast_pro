import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Palette, Space, Radius, Shadow, Type } from '@/constants/design';

export default function Splash() {
  const router = useRouter();

  // Gentle fade + rise so the logo settles into place rather than snapping in
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/(tabs)/Welcome');
    }, 2000);

    return () => clearTimeout(timer);
  }, [fade, rise, router]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fade, transform: [{ translateY: rise }] }]}>
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

      <Animated.Text style={[styles.footer, { opacity: fade }]}>
        Turning waste into value
      </Animated.Text>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.brand[50],
    justifyContent: 'center',
    alignItems: 'center',
    padding: Space.xl,
  },
  content: { alignItems: 'center' },
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
  name: { ...Type.h1, fontSize: 28, color: Palette.brand[900] },
  tagline: { ...Type.small, marginTop: Space.sm, color: Palette.brand[600], fontWeight: '600' },
  footer: {
    ...Type.caption,
    position: 'absolute',
    bottom: Space['4xl'],
    color: Palette.ink[300],
  },
});
