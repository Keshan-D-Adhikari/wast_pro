import { Platform } from 'react-native';
import MapView, { Callout, Marker, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';

export const APP_MAP_PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

export default MapView;
export { Callout, Marker, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT };
