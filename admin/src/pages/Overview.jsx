import { useEffect, useState } from "react";
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { IconUsers, IconMarketplace, IconOrders, IconLeaf } from "../components/Icons";

const REFRESH_MS = 30000;
// Revenue is summed from at most this many completed orders, so the cost of
// this page stays bounded as the data grows.
const REVENUE_ORDER_CAP = 500;

const count = async (q) => (await getCountFromServer(q)).data().count;

async function loadOverview() {
  const users = collection(db, "users");
  const listings = collection(db, "marketplace");
  const orders = collection(db, "orders");

  const [
    totalUsers, sellers, buyers, activeListings,
    totalOrders, pendingOrders, completedOrders, completedDocs,
  ] = await Promise.all([
    count(users),
    count(query(users, where("role", "==", "seller"))),
    count(query(users, where("role", "==", "buyer"))),
    count(query(listings, where("status", "==", "available"))),
    count(orders),
    count(query(orders, where("status", "in", ["pending", "confirmed"]))),
    count(query(orders, where("status", "==", "completed"))),
    getDocs(query(orders, where("status", "==", "completed"), limit(REVENUE_ORDER_CAP))),
  ]);

  const revenue = completedDocs.docs.reduce((sum, d) => sum + (d.data().totalPrice || 0), 0);
  return { totalUsers, sellers, buyers, activeListings, totalOrders, pendingOrders, completedOrders, revenue };
}

export default function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Counts are fetched with server-side count queries (not by streaming every
  // document), then refreshed on a timer.
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const next = await loadOverview();
        if (!cancelled) setData(next);
      } catch (err) {
        console.error("Overview load failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    refresh();
    const id = setInterval(refresh, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const d = data ?? {
    totalUsers: 0, sellers: 0, buyers: 0, activeListings: 0,
    totalOrders: 0, pendingOrders: 0, completedOrders: 0, revenue: 0,
  };

  const stats = [
    { label: "Total registered users", value: d.totalUsers, icon: <IconUsers size={22} />, category: "users" },
    { label: "Active sellers", value: d.sellers, icon: <IconUsers size={22} />, category: "users" },
    { label: "Active buyers", value: d.buyers, icon: <IconUsers size={22} />, category: "users" },
    { label: "Available listings", value: d.activeListings, icon: <IconMarketplace size={22} />, category: "market" },
    { label: "Total orders placed", value: d.totalOrders, icon: <IconOrders size={22} />, category: "orders" },
    { label: "Pending / confirmed orders", value: d.pendingOrders, icon: <IconOrders size={22} />, category: "orders" },
    { label: "Completed orders", value: d.completedOrders, icon: <IconOrders size={22} />, category: "orders" },
    { label: "Completed revenue", value: `Rs. ${d.revenue.toLocaleString()}`, icon: <IconLeaf size={22} />, category: "revenue" },
  ];

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Platform Overview</h1>
          <p className="subtitle">Platform statistics across users, marketplace activity, and completed transactions (refreshes every 30 seconds)</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state-box">
          <div className="loading-spinner" style={{ margin: "0 auto 1rem" }} />
          <p>Loading overview metrics…</p>
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
