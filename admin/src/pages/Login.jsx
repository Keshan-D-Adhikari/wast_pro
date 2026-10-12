// Login.jsx: the sign in page for admins. The admin types an email and password.
// It uses Firebase Authentication only (no Firestore here). After a successful sign in,
// AuthContext notices the change and the Gate in App.jsx shows the dashboard.
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { IconMail, IconLock, IconShield, IconLeaf, IconBin, IconMarketplace, IconAlert } from "../components/Icons";

// Login component.
export default function Login() {
  // Controlled form: each input's text lives in state (email, password), and the input shows
  // that state. onChange updates the state on every key press.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // error = message shown above the form; submitting = true while waiting for Firebase.
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Runs when the form is submitted. async/await waits for Firebase without freezing the page.
  const handleSubmit = async (e) => {
    // preventDefault stops the browser from reloading the page on submit.
    e.preventDefault();
    setError("");
    setSubmitting(true);
    // try/catch/finally: try signing in; if it fails show a friendly message
    // (we do not say which part was wrong); finally always re-enables the button.
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError("Invalid email or password. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  // Page has two halves: a brand panel on the left and the sign in form on the right.
  return (
    <div className="login-page">
      {/* Left Brand Panel */}
      <section className="login-brand-panel" aria-label="Brand Overview">
        <div className="brand-header-wrap">
          <img src="/logo.png" alt="SmartWaste Pro Logo" className="brand-logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="brand-title-group">
            <h2>SmartWaste Pro</h2>
            <span className="brand-tag">Environmental Platform</span>
          </div>
        </div>

        <div className="brand-hero-content">
          <div className="brand-badge">
            <IconLeaf size={16} />
            <span>Smart Waste · Smarter Recycling</span>
          </div>
          <h1>Unified Platform Administration</h1>
          <p>
            A connected IoT platform for smart-bin monitoring, recyclable waste management,
            marketplace transactions, and real-time environmental impact.
          </p>

          {/* A short list of what the platform does (text only). */}
          <div className="brand-feature-list">
            <div className="brand-feature-item">
              <div className="feature-icon-box">
                <IconBin size={16} />
              </div>
              <span>Live IoT smart-bin fill & weight telemetry</span>
            </div>
            <div className="brand-feature-item">
              <div className="feature-icon-box">
                <IconMarketplace size={16} />
              </div>
              <span>Recyclable waste marketplace & order management</span>
            </div>
            <div className="brand-feature-item">
              <div className="feature-icon-box">
                <IconShield size={16} />
              </div>
              <span>Role-based access control & security audit</span>
            </div>
          </div>
        </div>

        <div className="brand-footer-note">
          &copy; {new Date().getFullYear()} SmartWaste Pro. All rights reserved.
        </div>
      </section>

      {/* Right Login Form Panel */}
      <section className="login-form-panel" aria-label="Admin Sign In Form">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <div className="login-card-header">
            <span className="portal-badge">
              <IconShield size={14} />
              Admin Portal
            </span>
            <h1>Sign in</h1>
            <p className="subtitle">Sign in with your administrator account to access platform management.</p>
          </div>

          {/* Show the error banner only when there is an error message. */}
          {error && (
            <div className="error-banner" role="alert">
              <IconAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Email field (controlled input). */}
          <div className="form-group">
            <label className="form-label" htmlFor="admin-email">Email Address</label>
            <div className="input-with-icon">
              <span className="input-icon"><IconMail size={18} /></span>
              <input
                id="admin-email"
                type="email"
                className="input-field"
                placeholder="admin@smartwaste.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password field. type="password" hides the characters. */}
          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">Password</label>
            <div className="input-with-icon">
              <span className="input-icon"><IconLock size={18} /></span>
              <input
                id="admin-password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {/* The button is disabled while signing in so the form cannot be sent twice. */}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in to Dashboard"}
          </button>

          <div className="login-card-footer">
            <IconShield size={14} />
            <span>Protected with Firebase Authentication & Role Security</span>
          </div>
        </form>
      </section>
    </div>
  );
}
