import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <section>
      <h1>Users ({users.length})</h1>
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
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.fullName || "—"}</td>
                <td>{u.email || "—"}</td>
                <td>
                  <span className={`badge role-${u.role}`}>{u.role}</span>
                </td>
                <td>{u.phone || "—"}</td>
                <td>{u.location || "—"}</td>
                <td>{u.points ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
