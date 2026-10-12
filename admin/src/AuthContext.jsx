import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { AuthContext } from "./authContextInstance";

// AuthProvider wraps the app. `children` is whatever is placed inside it.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect runs code after the first render. The empty [] at the end means "only once".
  // onAuthStateChanged starts listening to sign in / sign out events. It returns an
  // unsubscribe function, and returning it here lets React stop the listener when this
  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      const snap = await getDoc(doc(db, "users", firebaseUser.uid));
      setProfile(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
  }, []);

  // ADMIN CHECK: true only when the profile role is "admin".
  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider
      value={{ user, profile, isAdmin, loading, logout: () => signOut(auth) }}
    >
      {children}
    </AuthContext.Provider>
  );
}
