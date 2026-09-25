import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { filterUsers } from "../lib/filters";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    return onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        setUsers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

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

  return (
    <section>
      <h1>Users ({filtered.length}/{users.length})</h1>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All roles</option>
          <option value="seller">Sellers</option>
          <option value="buyer">Buyers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {loading && <p>Loading…</p>}
      {!loading && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Location</th>
              <th>Points</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>{u.fullName || "—"}</td>
                <td>{u.email || "—"}</td>
                <td>
                  <span className={`badge role-${u.role}`}>{u.role}</span>
                </td>
                <td>{u.phone || "—"}</td>
                <td>{u.location || "—"}</td>
                <td>{u.points ?? "—"}</td>
                <td>
                  <span className={`badge ${u.disabled ? "status-cancelled" : "status-completed"}`}>
                    {u.disabled ? "Disabled" : "Active"}
                  </span>
                </td>
                <td>
                  {u.role !== "admin" && (
                    <button
                      type="button"
                      className={u.disabled ? "" : "danger"}
                      onClick={() => toggleDisabled(u)}
                    >
                      {u.disabled ? "Enable" : "Disable"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
