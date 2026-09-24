import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function Marketplace() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onSnapshot(
      collection(db, "marketplace"),
      (snapshot) => {
        setListings(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  const handleRemove = async (id) => {
    if (!confirm("Remove this listing? This cannot be undone.")) return;
    await deleteDoc(doc(db, "marketplace", id));
  };

  return (
    <section>
      <h1>Marketplace listings ({listings.length})</h1>
      {loading && <p>Loading…</p>}
      {!loading && (
        <table>
          <thead>
            <tr>
              <th>Waste type</th>
              <th>Weight</th>
              <th>Price</th>
              <th>Seller</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {listings.map((item) => (
              <tr key={item.id}>
                <td>{item.wasteType}</td>
                <td>{item.weightKg} kg</td>
                <td>Rs. {item.totalPrice}</td>
                <td>{item.sellerName}</td>
                <td>
                  <span className={`badge status-${item.status}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => handleRemove(item.id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
