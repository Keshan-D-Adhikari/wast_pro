import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../useAuth";
import {
  IconOverview,
  IconBin,
  IconUsers,
  IconMarketplace,
  IconOrders,
  IconSignOut,
  IconMenu,
  IconX,
  IconPulse
} from "../components/Icons";

const PAGE_TITLES = {
  "/": { title: "Overview", subtitle: "Snapshot across users, marketplace, and platform orders" },
  "/bins": { title: "Bin Telemetry", subtitle: "Real-time IoT sensors from ESP32 smart waste bins" },
  "/users": { title: "User Management", subtitle: "Manage registered buyers, sellers, and system roles" },
  "/marketplace": { title: "Marketplace Listings", subtitle: "Browse, monitor and manage active waste items" },
  "/orders": { title: "Orders & Transactions", subtitle: "Track completed and pending recycling purchases" }
};

export default function Layout() {
  const { profile, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const currentInfo = PAGE_TITLES[location.pathname] || {
    title: "Admin Portal",
    subtitle: "SmartWaste Pro Platform Administration"
  };

  const displayName = profile?.fullName || profile?.email || "Admin";
  const initial = displayName.charAt(0).toUpperCase();

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="app-shell">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={closeMobile} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`} aria-label="Sidebar Navigation">
        <div className="sidebar-header">
          <img
            src="/logo.png"
            alt="SmartWaste Pro"
            className="sidebar-logo"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <h2 className="sidebar-brand-name">SmartWaste Pro</h2>
            <span className="sidebar-badge">Admin Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Main Navigation</span>
          <NavLink to="/" end onClick={closeMobile}>
            <IconOverview size={19} />
            <span>Overview</span>
          </NavLink>
          <NavLink to="/bins" onClick={closeMobile}>
            <IconBin size={19} />
            <span>Bin Status</span>
          </NavLink>
          <NavLink to="/users" onClick={closeMobile}>
            <IconUsers size={19} />
            <span>Users</span>
          </NavLink>
          <NavLink to="/marketplace" onClick={closeMobile}>
            <IconMarketplace size={19} />
            <span>Marketplace</span>
          </NavLink>
          <NavLink to="/orders" onClick={closeMobile}>
            <IconOrders size={19} />
            <span>Orders</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-user-card">
            <div className="admin-avatar">{initial}</div>
            <div className="admin-user-info">
              <p className="admin-name" title={displayName}>{displayName}</p>
              <span className="admin-role-tag">Administrator</span>
            </div>
          </div>
          <button type="button" className="btn-signout" onClick={logout}>
            <IconSignOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileOpen ? <IconX size={22} /> : <IconMenu size={22} />}
            </button>
            <h2 className="topbar-title">{currentInfo.title}</h2>
          </div>

          <div className="topbar-right">
            <div className="system-status-pill">
              <span className="status-dot" />
              <IconPulse size={14} />
              <span>System Live</span>
            </div>
          </div>
        </header>

        <main className="content-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
