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
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
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
