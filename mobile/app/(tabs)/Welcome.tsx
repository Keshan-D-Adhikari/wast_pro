// WELCOME SCREEN (route "/Welcome")
// A short intro shown after the splash screen. It shows the app slogan, three key
// features, and a "Get Started" button that opens the Login screen.
// Flow: Splash -> Welcome -> Login
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Space, Radius, Type } from '@/constants/design';
import { Button } from '@/components/ui/button';

// The three feature lines shown on screen. Each has an icon and a text.
// "keyof typeof Ionicons.glyphMap" is a TypeScript type that only allows real
// Ionicons icon names, so a typo in an icon name gives an error at build time.
const HIGHLIGHTS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'hardware-chip-outline', text: 'Live smart-bin sensor readings' },
  { icon: 'storefront-outline', text: 'Sell recyclables to nearby buyers' },
  { icon: 'navigate-outline', text: 'Pickup routes and distances' },
];

export default function Welcome() {
  const router = useRouter();
  // Insets tell us the size of the unsafe areas (notch, home bar). We use the
  // bottom one so the button does not sit under the home bar.
  const insets = useSafeAreaInsets();

  return (
    // Full-screen photo as the background
    <ImageBackground
      source={require('../../assets/images/back1.png')}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Scrim keeps the copy readable regardless of the photo behind it */}
      <View style={styles.scrim} />

      {/* Main content, at the bottom of the screen */}
      <View style={[styles.content, { paddingBottom: insets.bottom + Space['3xl'] }]}>
        {/* Small label and big slogan ({'\n'} is a line break) */}
        <Text style={styles.eyebrow}>SMARTWASTE PRO</Text>
        <Text style={styles.title}>Manage waste smartly,{'\n'}create a cleaner world.</Text>

        {/* Feature list: .map turns each item of HIGHLIGHTS into one row.
            "key" helps React track each row in a list. */}
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

        {/* router.push adds Login on top, so the user can swipe or press Back to return here */}
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
  // Background photo and the pale overlay on top of it
  background: { flex: 1, justifyContent: 'flex-end' },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(244, 248, 242, 0.78)',
  },
  // Text block: small label and big slogan
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
  // Feature rows: round icon on the left, text on the right
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
