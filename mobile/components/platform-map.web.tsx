import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type AnyProps = Record<string, any>;

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

export function Marker(_props: AnyProps) {
  return null;
}

export function Polyline(_props: AnyProps) {
  return null;
}

export function Callout(_props: AnyProps) {
  return null;
}

export const PROVIDER_GOOGLE = 'google';

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
