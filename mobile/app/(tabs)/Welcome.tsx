import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Space, Radius, Type } from '@/constants/design';
import { Button } from '@/components/ui/button';

const HIGHLIGHTS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'hardware-chip-outline', text: 'Live smart-bin sensor readings' },
  { icon: 'storefront-outline', text: 'Sell recyclables to nearby buyers' },
  { icon: 'navigate-outline', text: 'Pickup routes and distances' },
];

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground
      source={require('../../assets/images/back1.png')}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Scrim keeps the copy readable regardless of the photo behind it */}
      <View style={styles.scrim} />

      <View style={[styles.content, { paddingBottom: insets.bottom + Space['3xl'] }]}>
        <Text style={styles.eyebrow}>SMARTWASTE PRO</Text>
        <Text style={styles.title}>Manage waste smartly,{'\n'}create a cleaner world.</Text>

        <View style={styles.highlights}>
          {HIGHLIGHTS.map((item) => (
            <View key={item.text} style={styles.highlightRow}>
              <View style={styles.highlightIcon}>
                <Ionicons name={item.icon} size={15} color={Palette.brand[600]} />
              </View>
              <Text style={styles.highlightText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <Button
          label="Get Started"
          icon="arrow-forward"
          onPress={() => router.push('/(tabs)/Login')}
        />
      </View>
    </ImageBackground>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  background: { flex: 1, justifyContent: 'flex-end' },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(244, 248, 242, 0.78)',
  },
  content: { paddingHorizontal: Space['2xl'] },
  eyebrow: {
    ...Type.caption,
    color: Palette.brand[600],
    letterSpacing: 1.6,
    marginBottom: Space.md,
  },
  title: {
    ...Type.h1,
    fontSize: 32,
    lineHeight: 40,
    color: Palette.brand[900],
    marginBottom: Space['2xl'],
  },
  highlights: { gap: Space.md, marginBottom: Space['3xl'] },
  highlightRow: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  highlightIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightText: { ...Type.small, color: Palette.ink[700], fontWeight: '500', flex: 1 },
});
