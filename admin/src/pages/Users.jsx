import { useEffect, useMemo, useState } from "react";
import { collection, deleteField, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { filterUsers, orderUsersAdminsFirst } from "../lib/filters";
import { validateUserEdit } from "../lib/userEdit";
import { usePaginatedCollection } from "../lib/usePaginatedCollection";
import { IconSearch, IconUsers } from "../components/Icons";

// Sellers without an assigned bin see the default prototype bin.
const DEFAULT_BIN = "bin001";

export default function Users() {
  const { docs: pagedUsers, loading, hasMore, loadMore } = usePaginatedCollection("users");
  // Admin accounts are fetched on their own so they always show at the top, even before "Load more".
  const [admins, setAdmins] = useState([]);
  useEffect(() => {
    return onSnapshot(
      query(collection(db, "users"), where("role", "==", "admin")),
      (snapshot) => setAdmins(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => {}
    );
  }, []);
  const users = useMemo(() => orderUsersAdminsFirst(pagedUsers, admins), [pagedUsers, admins]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editing, setEditing] = useState(null); // the user being edited, or null
  const [form, setForm] = useState({ fullName: "", phone: "", location: "", points: "" });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const filtered = useMemo(
    () => filterUsers(users, { search, role: roleFilter }),
    [users, search, roleFilter]
  );

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      fullName: u.fullName ?? "",
      phone: u.phone ?? "",
      location: u.location ?? "",
      points: u.points != null ? String(u.points) : "0",
    });
    setFormErrors({});
    setSaveError("");
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const result = validateUserEdit(form);
    setFormErrors(result.errors);
    if (!result.ok) return;
    setSaving(true);
    setSaveError("");
    try {
      await updateDoc(doc(db, "users", editing.id), { ...result.data, updatedAt: serverTimestamp() });
      setEditing(null);
    } catch (err) {
      console.error("Could not update user:", err);
      setSaveError("Could not save the changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

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
                      <button type="button" className="btn-sm-success" style={{ marginRight: "0.4rem" }} onClick={() => openEdit(u)}>
                        Edit
                      </button>
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

      {editing && (
        <div className="modal-overlay" onClick={() => !saving && setEditing(null)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={saveEdit} noValidate>
            <h2 style={{ margin: "0 0 0.25rem" }}>Edit user</h2>
            <p className="subtitle" style={{ margin: "0 0 1.25rem" }}>
              {editing.email} · <span className={`badge role-${editing.role}`}>{editing.role}</span>
            </p>

            {[
              ["fullName", "Full name", "text"],
              ["phone", "Phone number", "tel"],
              ["location", "Location", "text"],
              ["points", "Reward points", "text"],
            ].map(([key, label, type]) => (
              <div className="form-group" key={key}>
                <label className="form-label" htmlFor={`edit-${key}`}>{label}</label>
                <input
                  id={`edit-${key}`}
                  className="input-field plain"
                  type={type}
                  inputMode={key === "points" ? "numeric" : undefined}
                  value={form[key]}
                  onChange={setField(key)}
                />
                {formErrors[key] && <p className="field-error">{formErrors[key]}</p>}
              </div>
            ))}

            <p className="subtitle" style={{ margin: "0 0 1rem", fontSize: "0.8rem" }}>
              The email and role cannot be changed here.
            </p>
            {saveError && <p className="field-error">{saveError}</p>}

            <div className="modal-actions">
              <button type="button" className="load-more-btn" style={{ margin: 0 }} disabled={saving} onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" className="btn-sm-success" style={{ padding: "0.6rem 1.25rem" }} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
