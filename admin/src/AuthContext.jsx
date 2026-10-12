// AuthContext.jsx: keeps track of who is signed in and whether they are an admin.
// React context is a way to share a value with many components without passing props
// down level by level. AuthProvider holds the value; any component below it can read
// it with the useAuth() hook. Firestore collection used: "users" (field "role").
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { AuthContext } from "./authContextInstance";

// AuthProvider wraps the app. `children` is whatever is placed inside it.
export function AuthProvider({ children }) {
  // useState keeps a value between renders. When a setter is called, React redraws.
  // user = the Firebase Auth user; profile = their document in the "users" collection;
  // loading = true until we know the answer, so the app does not flash the login page.
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect runs code after the first render. The empty [] at the end means "only once".
  // onAuthStateChanged starts listening to sign in / sign out events. It returns an
  // unsubscribe function, and returning it here lets React stop the listener when this
  // component is removed (the "cleanup").
  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      // Signed out: clear everything and stop loading.
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      // Signed in: read the profile document users/<uid> once. The "role" field in it
      // decides if this person is an admin. If the document is missing, profile stays null.
      setUser(firebaseUser);
      const snap = await getDoc(doc(db, "users", firebaseUser.uid));
      setProfile(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
  }, []);

  // Admin only if the profile says role is "admin". The ?. avoids an error when profile is null.
  // This only controls what the screen shows. The real protection is in firestore.rules.
  const isAdmin = profile?.role === "admin";

  // Everything inside value={...} becomes available to useAuth(). logout signs the user out.
  return (
    <AuthContext.Provider
      value={{ user, profile, isAdmin, loading, logout: () => signOut(auth) }}
    >
      {children}
    </AuthContext.Provider>
  );
}
