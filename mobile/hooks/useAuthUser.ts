import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';

/**
 * The signed-in Firebase user, kept up to date.
 *
 * `auth.currentUser` is null for a moment after the app starts while the saved
 * session is restored from storage. A screen that reads it once in an effect
 * (for example when opened straight from a reload or a link) would start its
 * data listeners signed out and get "Missing or insufficient permissions".
 * Using this hook re-runs those effects as soon as the user is known.
 */
export function useAuthUser(): User | null {
  const [user, setUser] = useState<User | null>(auth.currentUser);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  return user;
}
