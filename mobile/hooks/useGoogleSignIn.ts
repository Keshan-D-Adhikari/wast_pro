import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential, UserCredential } from 'firebase/auth';
import { auth } from '../firebaseConfig';

WebBrowser.maybeCompleteAuthSession();

/**
 * Wraps expo-auth-session's Google provider + Firebase credential exchange
 * behind a single `signIn()` call that resolves with the signed-in Firebase
 * user, or null if the user cancelled or the flow otherwise didn't succeed.
 */
export function useGoogleSignIn() {
  // `clientId` is the generic per-platform fallback expo-auth-session checks
  // when there's no dedicated iosClientId/androidClientId (those need a
  // native OAuth client tied to a bundle id/package + SHA-1, which only
  // matters for a standalone/production build). Using the web client ID
  // here works for Expo Go and web testing on every platform.
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  const signIn = async (): Promise<UserCredential | null> => {
    const result = await promptAsync();
    if (result?.type !== 'success') return null;

    const idToken = result.params?.id_token;
    if (!idToken) return null;

    const credential = GoogleAuthProvider.credential(idToken);
    return signInWithCredential(auth, credential);
  };

  return { ready: !!request, signIn };
}
