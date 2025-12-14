import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function Welcome() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require('../../assets/images/back1.png')}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Content */}
      <View style={styles.content}>

        <Text style={styles.title}>WAST PRO</Text>

        <Text style={styles.subtitle}>
          Manage waste smartly, create a cleaner world.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(tabs)/Login')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

      </View>
    </ImageBackground>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-end',
    paddingBottom: 60,
    backgroundColor: 'rgba(255,255,255,0.15)', // soft overlay
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 30,
    lineHeight: 20,
    maxWidth: '85%',
  },
  button: {
    backgroundColor: '#4F772D', // eco green
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
