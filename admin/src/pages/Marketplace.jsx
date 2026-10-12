import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, limit, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { filterListings, filterSellers, groupListingsBySeller } from "../lib/filters";
import { IconSearch, IconMarketplace, IconTrash } from "../components/Icons";
import { userCode } from "../lib/shortId";

// The sellers list is built from this many of the newest-written listings at most.
const SELLER_SCAN_LIMIT = 500;

// Formats money for display. Example: rs(2500) -> "Rs. 2,500"; rs(null) -> "Rs. 0".
const rs = (value) =>
  `Rs. ${value != null ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0"}`;

// SellerListings: all listings of one seller. Props: seller (object from groupListingsBySeller)
// and onBack (function to return to the seller list).
/** One seller's listings, with the type / status filters and Remove. */
function SellerListings({ seller, onBack }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Live listener on marketplace documents where sellerUid equals this seller's uid.
  // d.id is the document id, d.data() is its fields; we merge them into one object.
  // The returned function is the cleanup that stops the listener. It restarts if the seller changes.
  useEffect(() => {
    return onSnapshot(
      query(collection(db, "marketplace"), where("sellerUid", "==", seller.sellerUid)),
      (snapshot) => {
        setListings(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [seller.sellerUid]);

  const filtered = useMemo(
    () => filterListings(listings, { status: statusFilter, wasteType: typeFilter }),
    [listings, statusFilter, typeFilter]
  );

  // Remove button: ask for confirmation, then delete the document marketplace/<id>.
  const handleRemove = async (id) => {
    if (!confirm("Remove this marketplace listing? This cannot be undone.")) return;
    await deleteDoc(doc(db, "marketplace", id));
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <button type="button" className="load-more-btn" style={{ margin: "0 0 0.75rem" }} onClick={onBack}>
            ← All sellers
          </button>
          <h1>{seller.sellerName}</h1>
          <p className="subtitle">
            Showing {filtered.length} of {listings.length} listings by this seller
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="select-filter-wrapper">
          <select className="select-filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Waste Types</option>
            <option value="plastic">Plastic</option>
            <option value="food">Food</option>
            <option value="metal">Metal</option>
          </select>
        </div>

        <div className="select-filter-wrapper">
          <select className="select-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="available">Available only</option>
            <option value="sold">Sold only</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="empty-state-box">
          <div className="loading-spinner" style={{ margin: "0 auto 1rem" }} />
          <p>Loading listings…</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state-box">
          <div className="empty-state-icon"><IconMarketplace size={24} /></div>
          <h3>No listings found</h3>
          <p>This seller has no listing that matches the filters.</p>
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
                  <th>Total Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const typeCls = (item.wasteType || "").toLowerCase();
                  return (
                    <tr key={item.id}>
                      <td>
                        <span className={`badge waste-${typeCls}`}>{item.wasteType || "Waste"}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.weightKg} kg</td>
                      <td style={{ fontWeight: 700, color: "var(--brand-700)" }}>{rs(item.totalPrice)}</td>
                      <td>
                        <span className={`badge status-${item.status}`}>{item.status}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn-sm-danger"
                          onClick={() => handleRemove(item.id)}
                          title="Delete listing"
                        >
                          <IconTrash size={14} />
                          <span>Remove</span>
                        </button>
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

// Marketplace: the seller list. It reads up to SELLER_SCAN_LIMIT listings and groups them by seller
// in the browser (groupListingsBySeller). Clicking a seller opens SellerListings.
/** Marketplace listings grouped by seller; pick a seller to see and manage their listings. */
export default function Marketplace() {
  const [selected, setSelected] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Live listener on the newest listings of the whole marketplace, capped with limit(). Cleanup stops it.
  useEffect(() => {
    return onSnapshot(
      query(collection(db, "marketplace"), limit(SELLER_SCAN_LIMIT)),
      (snapshot) => {
        setListings(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  // sellers = one group per seller. filtered = the sellers that match the search box.
  const sellers = useMemo(() => groupListingsBySeller(listings), [listings]);
  const filtered = useMemo(() => filterSellers(sellers, search), [sellers, search]);

  if (selected) {
    // Keep showing the seller's latest name/counts while their listings change
    const current = sellers.find((s) => s.sellerUid === selected.sellerUid) ?? selected;
    return <SellerListings seller={current} onBack={() => setSelected(null)} />;
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Marketplace Listings</h1>
          <p className="subtitle">
            {sellers.length} seller{sellers.length === 1 ? "" : "s"} with {listings.length} listing
            {listings.length === 1 ? "" : "s"}. Select a seller to see their listings.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-input-wrapper">
          <span className="search-icon"><IconSearch size={16} /></span>
          <input
            type="search"
            placeholder="Search by seller name or user ID (USR-…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading && (
        <div className="empty-state-box">
          <div className="loading-spinner" style={{ margin: "0 auto 1rem" }} />
          <p>Loading marketplace listings…</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state-box">
          <div className="empty-state-icon"><IconMarketplace size={24} /></div>
          <h3>{sellers.length === 0 ? "No listings yet" : "No sellers found"}</h3>
          <p>{sellers.length === 0 ? "No seller has posted waste yet." : "No seller matches your search."}</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="table-card">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Seller</th>
                  <th>Listings</th>
                  <th>Available</th>
                  <th>Sold</th>
                  <th>Total value</th>
                  <th style={{ textAlign: "right" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.sellerUid} style={{ cursor: "pointer" }} onClick={() => setSelected(s)}>
                    <td><code>{userCode(s.sellerUid)}</code></td>
                    <td style={{ fontWeight: 600 }}>{s.sellerName}</td>
                    <td>{s.total}</td>
                    <td><span className="badge status-completed">{s.available}</span></td>
                    <td><span className="badge status-pending">{s.sold}</span></td>
                    <td style={{ fontWeight: 700, color: "var(--brand-700)" }}>{rs(s.value)}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn-sm-success"
                        onClick={(e) => { e.stopPropagation(); setSelected(s); }}
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

      {!loading && listings.length >= SELLER_SCAN_LIMIT && (
        <p className="subtitle" style={{ marginTop: "1rem" }}>
          Showing sellers from the first {SELLER_SCAN_LIMIT} listings. Search for a seller to narrow down.
        </p>
      )}
    </section>
  );
}
