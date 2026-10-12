// useAuthUser HOOK
// A custom hook is a function (name starts with "use") that reuses React logic
// between screens. This one gives any screen the currently signed-in user, and
// sends the person to Login if nobody is signed in.
// Typical use inside a dashboard screen:  const user = useAuthUser();
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';

// Errors that mean the saved session belongs to an account that no longer exists
// (deleted) or can no longer sign in. A network error is NOT one of these.
// These are Firebase Auth error codes, compared against error.code below.
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
// Returns the Firebase User, or null while we are still loading / not signed in.
export function useAuthUser(): User | null {
  const router = useRouter();
  // useState keeps a value between renders. When setUser is called, React redraws
  // the screen that uses this hook.
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // onAuthStateChanged is a Firebase "listener". It calls our function once when
    // the app starts, and again every time the user signs in or out.
    // It returns an "unsubscribe" function. Returning it from useEffect makes React
    // stop listening when the screen closes, which avoids memory leaks.
    return onAuthStateChanged(auth, async (firebaseUser) => {
      // 1. Nobody is signed in: clear the user and go to Login.
      // router.replace is used so Back does not return to the protected screen.
      if (!firebaseUser) {
        setUser(null);
        router.replace('/(tabs)/Login');
        return;
      }

      // 2. Someone is signed in. Ask the server to refresh their data, to check
      // the account still exists.
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
      // 3. The account is fine, so share the user with the screen.
      setUser(firebaseUser);
    });
    // The effect runs again only if "router" changes.
  }, [router]);

  return user;
}
