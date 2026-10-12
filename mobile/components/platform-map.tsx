// Native (Android/iOS) map. This file is used on phones; platform-map.web.tsx replaces it on web.
// Screens import from here so they do not care which platform they run on.
// Used by the buyer pickup map and the seller bin location screens.

import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import RNMapView, {
  Callout as RNCallout,
  Marker as RNMarker,
  Polyline as RNPolyline,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
} from 'react-native-maps';

// Android uses Google Maps. iOS uses the default provider (Apple Maps).
export const APP_MAP_PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

// Google Maps on Android needs an API key inside the installed app. A build made without a key
// sets EXPO_PUBLIC_DISABLE_MAPS=true (see eas.json), and the app shows a placeholder instead of
// a map, so it does not crash. In Expo Go the flag is not set and the real map is used.
const MAPS_DISABLED = process.env.EXPO_PUBLIC_DISABLE_MAPS === 'true';

// Shown in place of the map. Markers and lines draw nothing.
function MapPlaceholder({ style }: { style?: object }) {
  return (
    <View style={[styles.placeholder, style]}>
      <Text style={styles.placeholderText}>Map is not available in this build.</Text>
    </View>
  );
}
const Nothing = () => null;

const MapView = (MAPS_DISABLED ? MapPlaceholder : RNMapView) as typeof RNMapView;
const Marker = (MAPS_DISABLED ? Nothing : RNMarker) as typeof RNMarker;
const Polyline = (MAPS_DISABLED ? Nothing : RNPolyline) as typeof RNPolyline;
const Callout = (MAPS_DISABLED ? Nothing : RNCallout) as typeof RNCallout;

// Re-export the map pieces so screens import everything from one place.
export default MapView;
export { Callout, Marker, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT };

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
    padding: 16,
  },
  placeholderText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
  },
});
