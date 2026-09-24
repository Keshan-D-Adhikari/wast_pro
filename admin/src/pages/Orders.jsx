import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    return onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort(
          (a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
        );
        setOrders(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      const matchesTerm =
        !term ||
        o.buyerName?.toLowerCase().includes(term) ||
        o.sellerName?.toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  }, [orders, search, statusFilter]);

  const handleStatusChange = async (order, status) => {
    if (status === order.status) return;
    await updateDoc(doc(db, "orders", order.id), { status });
  };

  return (
    <section>
      <h1>
        Orders ({filtered.length}/{orders.length})
      </h1>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by buyer or seller name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Loading…</p>}
      {!loading && (
        <table>
          <thead>
            <tr>
              <th>Waste type</th>
              <th>Weight</th>
              <th>Price</th>
              <th>Buyer</th>
              <th>Seller</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id}>
                <td>{o.wasteType}</td>
                <td>{o.weightKg} kg</td>
                <td>Rs. {o.totalPrice}</td>
                <td>{o.buyerName}</td>
                <td>{o.sellerName}</td>
                <td>
                  {o.paymentMethod} · {o.paymentStatus}
                </td>
                <td>
                  <select
                    className={`badge status-${o.status}`}
                    value={o.status}
                    onChange={(e) => handleStatusChange(o, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
