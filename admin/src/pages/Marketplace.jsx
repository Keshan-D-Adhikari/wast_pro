import { useEffect, useMemo, useState } from "react";
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return listings.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesType = typeFilter === "all" || item.wasteType === typeFilter;
      const matchesTerm = !term || item.sellerName?.toLowerCase().includes(term);
      return matchesStatus && matchesType && matchesTerm;
    });
  }, [listings, search, statusFilter, typeFilter]);

  const handleRemove = async (id) => {
    if (!confirm("Remove this listing? This cannot be undone.")) return;
    await deleteDoc(doc(db, "marketplace", id));
  };

  return (
    <section>
      <h1>
        Marketplace listings ({filtered.length}/{listings.length})
      </h1>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by seller name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All waste types</option>
          <option value="plastic">Plastic</option>
          <option value="food">Food</option>
          <option value="metal">Metal</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
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
              <th>Seller</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
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
