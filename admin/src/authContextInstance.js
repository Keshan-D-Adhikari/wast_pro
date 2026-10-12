// Creates the shared "box" (context) that holds the login info.
// It lives in its own file so AuthContext.jsx and useAuth.js can both import it.
// The default value null is used only if a component is outside AuthProvider.
import { createContext } from "react";

export const AuthContext = createContext(null);
