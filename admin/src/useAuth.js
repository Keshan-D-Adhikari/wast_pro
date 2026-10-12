// useAuth: a small custom hook. A hook is a function whose name starts with "use"
// and that can use React features. This one reads the AuthContext, so any page can do:
//   const { user, isAdmin, loading, logout } = useAuth();
import { useContext } from "react";
import { AuthContext } from "./authContextInstance";

export function useAuth() {
  return useContext(AuthContext);
}
