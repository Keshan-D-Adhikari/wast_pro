import { useMemo, useState } from "react";
import { deleteField, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { filterUsers } from "../lib/filters";
import { usePaginatedCollection } from "../lib/usePaginatedCollection";
import { IconSearch, IconUsers } from "../components/Icons";

// Sellers without an assigned bin see the default prototype bin.
const DEFAULT_BIN = "bin001";

export default function Users() {
  const { docs: users, loading, hasMore, loadMore } = usePaginatedCollection("users");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = useMemo(
    () => filterUsers(users, { search, role: roleFilter }),
    [users, search, roleFilter]
  );

  const toggleDisabled = async (u) => {
    const action = u.disabled ? "re-enable" : "disable";
    if (!confirm(`${action === "disable" ? "Disable" : "Re-enable"} ${u.fullName || u.email}?`))
      return;
    await updateDoc(doc(db, "users", u.id), { disabled: !u.disabled });
  };

  // Link a seller to a smart bin (a key under bins/ in the IoT database). Empty = use the default bin.
  const assignBin = async (u) => {
    const next = window.prompt(
      `Smart bin ID for ${u.fullName || u.email}\n(leave empty to use the default, ${DEFAULT_BIN})`,
      u.binId || ""
    );
    if (next === null) return;
    const id = next.trim();
    if (id && !/^[A-Za-z0-9_-]{1,32}$/.test(id)) {
      window.alert("Use only letters, numbers, - or _ (up to 32 characters).");
      return;
    }
    await updateDoc(doc(db, "users", u.id), { binId: id || deleteField() });
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>User Accounts</h1>
          <p className="subtitle">
            Showing {filtered.length} of {users.length} registered accounts across all roles
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-input-wrapper">
          <span className="search-icon"><IconSearch size={16} /></span>
          <input
            type="search"
            placeholder="Search by user name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="select-filter-wrapper">
          <select
            className="select-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="seller">Sellers only</option>
            <option value="buyer">Buyers only</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="empty-state-box">
          <div className="loading-spinner" style={{ margin: "0 auto 1rem" }} />
          <p>Loading user directory…</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state-box">
          <div className="empty-state-icon"><IconUsers size={24} /></div>
          <h3>No users found</h3>
          <p>No account matches your search query or filter selection.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="table-card">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Phone Number</th>
                  <th>Location</th>
                  <th>Smart Bin</th>
                  <th>Points</th>
                  <th>Account Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.fullName || "—"}</td>
                    <td style={{ color: "var(--ink-700)" }}>{u.email || "—"}</td>
                    <td>
                      <span className={`badge role-${u.role}`}>{u.role}</span>
                    </td>
                    <td>{u.phone || "—"}</td>
                    <td>{u.location || "—"}</td>
                    <td>
                      {u.role === "seller" ? (
                        <>
                          <code>{u.binId || DEFAULT_BIN}</code>
                          {!u.binId && <span style={{ color: "var(--ink-500)", fontSize: "0.75rem" }}> (default)</span>}{" "}
                          <button type="button" className="btn-sm-success" onClick={() => assignBin(u)}>
                            Set bin
                          </button>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: "var(--brand-700)" }}>
                        {u.points != null ? u.points : "0"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.disabled ? "status-cancelled" : "status-completed"}`}>
                        {u.disabled ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {u.role !== "admin" && (
                        <button
                          type="button"
                          className={u.disabled ? "btn-sm-success" : "btn-sm-danger"}
                          onClick={() => toggleDisabled(u)}
                        >
                          {u.disabled ? "Re-enable" : "Disable"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && hasMore && (
        <button type="button" className="load-more-btn" onClick={loadMore}>
          Load more accounts
        </button>
      )}
    </section>
  );
}
