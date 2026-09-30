import { useMemo, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { filterOrders } from "../lib/filters";
import { usePaginatedCollection } from "../lib/usePaginatedCollection";
import { IconSearch, IconOrders } from "../components/Icons";

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];

export default function Orders() {
  const { docs: rawOrders, loading, hasMore, loadMore } = usePaginatedCollection("orders");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const orders = useMemo(
    () =>
      [...rawOrders].sort(
        (a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
      ),
    [rawOrders]
  );

  const filtered = useMemo(
    () => filterOrders(orders, { search, status: statusFilter }),
    [orders, search, statusFilter]
  );

  const handleStatusChange = async (order, status) => {
    if (status === order.status) return;
    await updateDoc(doc(db, "orders", order.id), { status });
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Order Management</h1>
          <p className="subtitle">
            Showing {filtered.length} of {orders.length} transaction orders placed across the platform
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-input-wrapper">
          <span className="search-icon"><IconSearch size={16} /></span>
          <input
            type="search"
            placeholder="Search by buyer or seller name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="select-filter-wrapper">
          <select
            className="select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
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
          <p>Loading transactions and orders…</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state-box">
          <div className="empty-state-icon"><IconOrders size={24} /></div>
          <h3>No orders found</h3>
          <p>No transaction matches your search query or filter selection.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="table-card">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
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
                      <td>
                        <span className={`badge waste-${typeCls}`}>
                          {o.wasteType || "Waste"}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{o.weightKg} kg</td>
                      <td style={{ fontWeight: 700, color: "var(--brand-700)" }}>
                        Rs. {o.totalPrice != null ? o.totalPrice.toLocaleString() : "0"}
                      </td>
                      <td style={{ fontWeight: 500 }}>{o.buyerName || "—"}</td>
                      <td style={{ color: "var(--ink-700)" }}>{o.sellerName || "—"}</td>
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

      {!loading && hasMore && (
        <button type="button" className="load-more-btn" onClick={loadMore}>
          Load more orders
        </button>
      )}
    </section>
  );
}
