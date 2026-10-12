// Overview.jsx: the home page. The admin sees 8 number cards: total users, sellers, buyers,
// available listings, total orders, pending/confirmed orders, completed orders and revenue.
// Firestore collections read: "users", "marketplace" and "orders" (read only).
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

// The numbers are refreshed every 30 seconds (in milliseconds).
const REFRESH_MS = 30000;
// Revenue is summed from at most this many completed orders, so the cost of
// this page stays bounded as the data grows.
const REVENUE_ORDER_CAP = 500;

// Asks Firestore to count the documents of a query on the server. This returns only a
// number, so we do not download every document. Costs far less than reading them all.
const count = async (q) => (await getCountFromServer(q)).data().count;

// Loads every number for the cards. In: nothing. Out: an object with the 8 values.
// Promise.all runs all the requests at the same time and waits until all are done.
async function loadOverview() {
  const users = collection(db, "users");
  const listings = collection(db, "marketplace");
  const orders = collection(db, "orders");

  // Array destructuring: each name here gets the result of the request at the same position below.
  const [
    totalUsers, sellers, buyers, activeListings,
    totalOrders, pendingOrders, completedOrders, completedDocs,
  ] = await Promise.all([
    // Counts: all users, then users with role seller, role buyer.
    count(users),
    count(query(users, where("role", "==", "seller"))),
    count(query(users, where("role", "==", "buyer"))),
    // Marketplace listings whose status is "available".
    count(query(listings, where("status", "==", "available"))),
    // Orders: all, pending or confirmed ("in" matches any value in the list), and completed.
    count(orders),
    count(query(orders, where("status", "in", ["pending", "confirmed"]))),
    count(query(orders, where("status", "==", "completed"))),
    // The completed orders themselves (up to the cap), because revenue needs their totalPrice.
    getDocs(query(orders, where("status", "==", "completed"), limit(REVENUE_ORDER_CAP))),
  ]);

  // reduce adds up totalPrice of each completed order. A missing price counts as 0.
  const revenue = completedDocs.docs.reduce((sum, d) => sum + (d.data().totalPrice || 0), 0);
  return { totalUsers, sellers, buyers, activeListings, totalOrders, pendingOrders, completedOrders, revenue };
}

// Overview component.
export default function Overview() {
  // data = the loaded numbers (null before the first load); loading = show the spinner.
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect runs after the first render. Here it loads the numbers and starts a timer.
  // The "cancelled" flag stops us from updating state after the page was closed.
  // Counts are fetched with server-side count queries (not by streaming every
  // document), then refreshed on a timer.
  useEffect(() => {
    let cancelled = false;
    // One refresh: load the numbers, store them. Errors are logged, not shown.
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
    // Load once now, then again every REFRESH_MS.
    refresh();
    const id = setInterval(refresh, REFRESH_MS);
    // Cleanup: runs when the admin leaves the page. It stops the timer and ignores late answers.
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Before the first load we use zeros, so the code below never reads a missing value.
  const d = data ?? {
    totalUsers: 0, sellers: 0, buyers: 0, activeListings: 0,
    totalOrders: 0, pendingOrders: 0, completedOrders: 0, revenue: 0,
  };

  // One object per card. `category` only picks the card colour in CSS.
  const stats = [
    { label: "Total registered users", value: d.totalUsers, icon: <IconUsers size={22} />, category: "users" },
    { label: "Active sellers", value: d.sellers, icon: <IconUsers size={22} />, category: "users" },
    { label: "Active buyers", value: d.buyers, icon: <IconUsers size={22} />, category: "users" },
    { label: "Available listings", value: d.activeListings, icon: <IconMarketplace size={22} />, category: "market" },
    { label: "Total orders placed", value: d.totalOrders, icon: <IconOrders size={22} />, category: "orders" },
    { label: "Pending / confirmed orders", value: d.pendingOrders, icon: <IconOrders size={22} />, category: "orders" },
    { label: "Completed orders", value: d.completedOrders, icon: <IconOrders size={22} />, category: "orders" },
    // Revenue is formatted with thousands separators, for example Rs. 12,500.
    { label: "Completed revenue", value: `Rs. ${d.revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: <IconLeaf size={22} />, category: "revenue" },
  ];

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Platform Overview</h1>
          <p className="subtitle">Platform statistics across users, marketplace activity, and completed transactions (refreshes every 30 seconds)</p>
        </div>
      </div>

      {/* Loading spinner first, then the grid of cards. */}
      {loading ? (
        <div className="empty-state-box">
          <div className="loading-spinner" style={{ margin: "0 auto 1rem" }} />
          <p>Loading overview metrics…</p>
        </div>
      ) : (
        <div className="stat-grid">
          {/* map turns each item in `stats` into a card. key helps React track each card. */}
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
