// Web version of the map. react-native-maps does not work in a browser, so this file
// provides simple stand-ins with the same names. Expo picks the .web.tsx file automatically on web.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Accept any props so screens can pass the same props they pass to the real map.
type AnyProps = Record<string, any>;

// Shows a grey box with a message instead of a map.
export default function MapView({ style, children }: AnyProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>
        Map view isn&apos;t available in the web preview.{'\n'}Open this app in Expo Go on Android/iOS to see the live map.
      </Text>
      {children}
    </View>
  );
}

// Markers, lines and callouts draw nothing on web.
export function Marker(_props: AnyProps) {
  return null;
}

export function Polyline(_props: AnyProps) {
  return null;
}

export function Callout(_props: AnyProps) {
  return null;
}

// Same name as the real library exports, so imports keep working.
export const PROVIDER_GOOGLE = 'google';

// Grey centred box for the message.
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
    padding: 16,
  },
  text: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 13,
  },
});
