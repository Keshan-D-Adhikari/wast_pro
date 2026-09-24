import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../useAuth";

export default function Layout() {
  const { profile, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h2>WastPro Admin</h2>
        <nav>
          <NavLink to="/" end>
            Overview
          </NavLink>
          <NavLink to="/bins">Bin Status</NavLink>
          <NavLink to="/users">Users</NavLink>
          <NavLink to="/marketplace">Marketplace</NavLink>
          <NavLink to="/orders">Orders</NavLink>
        </nav>
        <div className="sidebar-footer">
          <p>{profile?.fullName || profile?.email}</p>
          <button type="button" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
