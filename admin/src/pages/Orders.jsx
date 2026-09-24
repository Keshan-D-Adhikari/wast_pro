import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <section>
      <h1>Orders ({orders.length})</h1>
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
            {orders.map((o) => (
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
                  <span className={`badge status-${o.status}`}>{o.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
