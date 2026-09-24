import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function Overview() {
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (s) =>
      setUsers(s.docs.map((d) => d.data()))
    );
    const unsubListings = onSnapshot(collection(db, "marketplace"), (s) =>
      setListings(s.docs.map((d) => d.data()))
    );
    const unsubOrders = onSnapshot(collection(db, "orders"), (s) => {
      setOrders(s.docs.map((d) => d.data()));
      setLoading(false);
    });
    return () => {
      unsubUsers();
      unsubListings();
      unsubOrders();
    };
  }, []);

  const sellers = users.filter((u) => u.role === "seller").length;
  const buyers = users.filter((u) => u.role === "buyer").length;
  const activeListings = listings.filter((l) => l.status === "available").length;
  const completedOrders = orders.filter((o) => o.status === "completed");
  const revenue = completedOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const pendingOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "confirmed"
  ).length;

  const stats = [
    { label: "Total users", value: users.length },
    { label: "Sellers", value: sellers },
    { label: "Buyers", value: buyers },
    { label: "Active listings", value: activeListings },
    { label: "Total orders", value: orders.length },
    { label: "Pending / confirmed orders", value: pendingOrders },
    { label: "Completed orders", value: completedOrders.length },
    { label: "Revenue (completed)", value: `Rs. ${revenue.toLocaleString()}` },
  ];

  return (
    <section>
      <h1>Overview</h1>
      <p className="subtitle">Snapshot across users, marketplace, and orders</p>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="stat-grid">
          {stats.map((s) => (
            <div className="stat-card" key={s.label}>
              <p className="stat-value">{s.value}</p>
              <p className="stat-label">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
