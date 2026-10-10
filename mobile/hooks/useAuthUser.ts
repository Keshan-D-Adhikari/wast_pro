import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';

// Errors that mean the saved session belongs to an account that no longer exists
// (deleted) or can no longer sign in. A network error is NOT one of these.
const DEAD_SESSION_CODES = [
  'auth/user-not-found',
  'auth/user-disabled',
  'auth/user-token-expired',
  'auth/invalid-user-token',
];

/**
 * The signed-in Firebase user, kept up to date, for screens that need one.
 *
 * - `auth.currentUser` is null for a moment after the app starts while the saved
 *   session is restored from storage. A screen that reads it once in an effect
 *   would start its data listeners signed out and get "Missing or insufficient
 *   permissions". This hook reports the user only once Firebase knows it.
 * - The saved session can outlive the account (deleted or disabled on the
 *   server). It is checked once, and a dead session is signed out instead of
 *   being used for requests that would all be denied.
 * - When nobody is signed in, the user is sent to the Login screen.
 */
export function useAuthUser(): User | null {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        router.replace('/(tabs)/Login');
        return;
      }

      try {
        await firebaseUser.reload();
      } catch (error) {
        const code = (error as { code?: string }).code ?? '';
        if (DEAD_SESSION_CODES.includes(code)) {
          await signOut(auth); // triggers this callback again with null, which goes to Login
          return;
        }
        // Offline or a temporary error: keep the user rather than logging them out.
      }
      setUser(firebaseUser);
    });
  }, [router]);

  return user;
}
