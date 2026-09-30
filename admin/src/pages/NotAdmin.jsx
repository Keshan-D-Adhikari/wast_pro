import { useAuth } from "../useAuth";
import { IconShield, IconAlert, IconSignOut } from "../components/Icons";

export default function NotAdmin() {
  const { logout } = useAuth();

  return (
    <div className="login-page">
      <div className="login-form-panel" style={{ width: "100%" }}>
        <div className="login-card" style={{ textAlign: "center" }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--status-danger-tint)",
            color: "var(--status-danger)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem"
          }}>
            <IconAlert size={28} />
          </div>

          <span className="portal-badge" style={{ margin: "0 auto 1rem", background: "var(--status-danger-tint)", color: "var(--status-danger)", borderColor: "rgba(194,53,47,0.2)" }}>
            <IconShield size={14} />
            Access Restricted
          </span>

          <h1 style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>Admin Privileges Required</h1>
          <p className="subtitle" style={{ marginBottom: "1.75rem" }}>
            This account is not configured with administrative permissions. To grant access, an existing administrator must set your <code>users/&#123;uid&#125;</code> document's <code>role</code> field to <code>"admin"</code> in the Firebase Firestore database.
          </p>

          <button type="button" className="btn-primary" onClick={logout} style={{ background: "var(--ink-700)" }}>
            <IconSignOut size={16} />
            <span>Sign out and return</span>
          </button>
        </div>
      </div>
    </div>
  );
}
