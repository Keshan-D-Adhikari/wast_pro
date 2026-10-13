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

// FUNCTION: useAuthUser - runs when a protected screen opens; gives the signed-in user, or sends the person to Login if nobody is signed in.
export function useAuthUser(): User | null {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // onAuthStateChanged is a Firebase "listener". It calls our function once when
    // the app starts, and again every time the user signs in or out.
    // It returns an "unsubscribe" function. Returning it from useEffect makes React
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
