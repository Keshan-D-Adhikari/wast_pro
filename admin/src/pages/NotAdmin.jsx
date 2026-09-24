import { useAuth } from "../useAuth";

export default function NotAdmin() {
  const { logout } = useAuth();

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Access denied</h1>
        <p className="subtitle">
          This account isn't set up as an admin. Ask an existing admin to set
          your <code>users/&#123;uid&#125;</code> document's <code>role</code>{" "}
          field to <code>"admin"</code> in the Firebase console.
        </p>
        <button type="button" onClick={logout}>
          Sign out
        </button>
      </div>
    </div>
  );
}
