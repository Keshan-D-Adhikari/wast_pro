import { useEffect, useMemo, useState } from "react";
import { collection, doc, limit, onSnapshot, or, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { filterOrders, filterPeople, groupOrdersByUser } from "../lib/filters";
import { IconSearch, IconOrders } from "../components/Icons";
import { orderCode, userCode } from "../lib/shortId";

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];

// The people list is built from at most this many orders.
const ORDER_SCAN_LIMIT = 500;

// Formats money for display. Example: rs(2500) -> "Rs. 2,500"; rs(null) -> "Rs. 0".
const rs = (value) =>
  `Rs. ${value != null ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0"}`;

// Sort helper for newest first. createdAt is a Firestore Timestamp; toMillis() makes it a number.
// Orders without a date count as 0 and go last.
const newestFirst = (a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);

// UserOrders: all orders one person is in. Props: person (from groupOrdersByUser) and
// onBack (function to return to the list).
/** All orders one user is part of (as buyer or as seller), with a status filter and status change. */
function UserOrders({ person, onBack }) {
  const [rawOrders, setRawOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Live listener on orders where buyerUid OR sellerUid is this person. or(...) lets one query
  // match either field. The returned function is the cleanup that stops the listener.
  useEffect(() => {
    return onSnapshot(
      query(
        collection(db, "orders"),
        or(where("buyerUid", "==", person.uid), where("sellerUid", "==", person.uid))
      ),
      (snapshot) => {
        setRawOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [person.uid]);

  // Newest first (copy with [...] before sort so we do not change the state array), then apply the status filter.
  const orders = useMemo(() => [...rawOrders].sort(newestFirst), [rawOrders]);
  const filtered = useMemo(() => filterOrders(orders, { status: statusFilter }), [orders, statusFilter]);

  // FUNCTION: handleStatusChange
  // Runs when: the admin picks a status in the dropdown.
  // What it does: updates the order status in Firestore.
  // Admin picked a new status in a row's dropdown: save it on orders/<id>. The listener refreshes the table.
  const handleStatusChange = async (order, status) => {
    if (status === order.status) return;
    await updateDoc(doc(db, "orders", order.id), { status });
  };

  return (
    <section>
      <div className="page-header">
        <div>
          {/* BUTTON: "← All users" */}
          <button type="button" className="load-more-btn" style={{ margin: "0 0 0.75rem" }} onClick={onBack}>
            ← All users
          </button>
          <h1>{person.name}</h1>
          <p className="subtitle">
            Showing {filtered.length} of {orders.length} orders where this {person.role} is involved
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="select-filter-wrapper">
          <select className="select-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)} only
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="empty-state-box">
          <div className="loading-spinner" style={{ margin: "0 auto 1rem" }} />
          <p>Loading orders…</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state-box">
          <div className="empty-state-icon"><IconOrders size={24} /></div>
          <h3>No orders found</h3>
          <p>No order matches the selected status.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="table-card">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Waste Type</th>
                  <th>Weight</th>
                  <th>Total Amount</th>
                  <th>Buyer</th>
                  <th>Seller</th>
                  <th>Payment Method</th>
                  <th>Order Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const typeCls = (o.wasteType || "").toLowerCase();
                  return (
                    <tr key={o.id}>
                      <td><code>{orderCode(o.id)}</code></td>
                      <td>
                        <span className={`badge waste-${typeCls}`}>{o.wasteType || "Waste"}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{o.weightKg} kg</td>
                      <td style={{ fontWeight: 700, color: "var(--brand-700)" }}>{rs(o.totalPrice)}</td>
                      <td style={{ fontWeight: o.buyerUid === person.uid ? 700 : 500 }}>{o.buyerName || "—"}</td>
                      <td style={{ fontWeight: o.sellerUid === person.uid ? 700 : 400, color: "var(--ink-700)" }}>
                        {o.sellerName || "—"}
                      </td>
                      <td>
                        <span style={{ fontSize: "0.86rem", textTransform: "capitalize", color: "var(--ink-700)" }}>
                          {o.paymentMethod || "Cash"}
                          {o.paymentStatus ? ` · ${o.paymentStatus}` : ""}
                        </span>
                      </td>
                      <td>
                        <select
                          className={`badge status-${o.status}`}
                          value={o.status}
                          onChange={(e) => handleStatusChange(o, e.target.value)}
                          aria-label={`Change status for order ${o.id}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

// Orders: the people list. It reads up to ORDER_SCAN_LIMIT orders and groups them by buyer and
// seller in the browser (groupOrdersByUser). Clicking a person opens UserOrders.
/** Orders grouped by user (buyers and sellers); pick a user to see their orders. */
export default function Orders() {
  const [selected, setSelected] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Live listener on the orders collection, capped with limit(). Cleanup stops it.
  useEffect(() => {
    return onSnapshot(
      query(collection(db, "orders"), limit(ORDER_SCAN_LIMIT)),
      (snapshot) => {
        setOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  // people = one row per person. filtered = those that match the search (name, USR or ORD code).
  const people = useMemo(() => groupOrdersByUser(orders), [orders]);
  const filtered = useMemo(() => filterPeople(people, search), [people, search]);

  if (selected) {
    const current = people.find((p) => p.uid === selected.uid) ?? selected;
    return <UserOrders person={current} onBack={() => setSelected(null)} />;
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Order Management</h1>
          <p className="subtitle">
            {people.length} user{people.length === 1 ? "" : "s"} across {orders.length} order
            {orders.length === 1 ? "" : "s"}. Select a user to see their orders.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-input-wrapper">
          <span className="search-icon"><IconSearch size={16} /></span>
          <input
            type="search"
            placeholder="Search by name, user ID (USR-…) or order ID (ORD-…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading && (
        <div className="empty-state-box">
          <div className="loading-spinner" style={{ margin: "0 auto 1rem" }} />
          <p>Loading transactions and orders…</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state-box">
          <div className="empty-state-icon"><IconOrders size={24} /></div>
          <h3>{people.length === 0 ? "No orders yet" : "No users found"}</h3>
          <p>{people.length === 0 ? "No order has been placed yet." : "No user matches your search."}</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="table-card">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Orders</th>
                  <th>Ongoing</th>
                  <th>Completed</th>
                  <th>Cancelled</th>
                  <th>Completed value</th>
                  <th style={{ textAlign: "right" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.uid} style={{ cursor: "pointer" }} onClick={() => setSelected(p)}>
                    <td><code>{userCode(p.uid)}</code></td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className={`badge role-${p.role}`}>{p.role}</span></td>
                    <td>{p.total}</td>
                    <td><span className="badge status-pending">{p.ongoing}</span></td>
                    <td><span className="badge status-completed">{p.completed}</span></td>
                    <td><span className="badge status-cancelled">{p.cancelled}</span></td>
                    <td style={{ fontWeight: 700, color: "var(--brand-700)" }}>{rs(p.value)}</td>
                    <td style={{ textAlign: "right" }}>
                      {/* BUTTON: "View" */}
                      <button
                        type="button"
                        className="btn-sm-success"
                        onClick={(e) => { e.stopPropagation(); setSelected(p); }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && orders.length >= ORDER_SCAN_LIMIT && (
        <p className="subtitle" style={{ marginTop: "1rem" }}>
          Showing users from the first {ORDER_SCAN_LIMIT} orders. Search for a user to narrow down.
        </p>
      )}
    </section>
  );
}
