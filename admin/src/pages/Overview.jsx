import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { IconUsers, IconMarketplace, IconOrders, IconLeaf } from "../components/Icons";

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
    { label: "Total registered users", value: users.length, icon: <IconUsers size={22} />, category: "users" },
    { label: "Active sellers", value: sellers, icon: <IconUsers size={22} />, category: "users" },
    { label: "Active buyers", value: buyers, icon: <IconUsers size={22} />, category: "users" },
    { label: "Available listings", value: activeListings, icon: <IconMarketplace size={22} />, category: "market" },
    { label: "Total orders placed", value: orders.length, icon: <IconOrders size={22} />, category: "orders" },
    { label: "Pending / confirmed orders", value: pendingOrders, icon: <IconOrders size={22} />, category: "orders" },
    { label: "Completed orders", value: completedOrders.length, icon: <IconOrders size={22} />, category: "orders" },
    { label: "Completed revenue", value: `Rs. ${revenue.toLocaleString()}`, icon: <IconLeaf size={22} />, category: "revenue" },
  ];

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Platform Overview</h1>
          <p className="subtitle">Real-time statistics across users, marketplace activity, and completed transactions</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state-box">
          <div className="loading-spinner" style={{ margin: "0 auto 1rem" }} />
          <p>Loading real-time overview metrics…</p>
        </div>
      ) : (
        <div className="stat-grid">
          {stats.map((s) => (
            <div className={`stat-card ${s.category}`} key={s.label}>
              <div className="stat-card-top">
                <div className="stat-icon-wrapper">{s.icon}</div>
              </div>
              <p className="stat-value">{s.value}</p>
              <p className="stat-label">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
