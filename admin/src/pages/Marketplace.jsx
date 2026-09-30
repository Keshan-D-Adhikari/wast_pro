import { useMemo, useState } from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { filterListings } from "../lib/filters";
import { usePaginatedCollection } from "../lib/usePaginatedCollection";
import { IconSearch, IconMarketplace, IconTrash } from "../components/Icons";

export default function Marketplace() {
  const { docs: listings, loading, hasMore, loadMore } = usePaginatedCollection("marketplace");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(
    () => filterListings(listings, { search, status: statusFilter, wasteType: typeFilter }),
    [listings, search, statusFilter, typeFilter]
  );

  const handleRemove = async (id) => {
    if (!confirm("Remove this marketplace listing? This cannot be undone.")) return;
    await deleteDoc(doc(db, "marketplace", id));
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Marketplace Listings</h1>
          <p className="subtitle">
            Showing {filtered.length} of {listings.length} waste posts across sellers
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-input-wrapper">
          <span className="search-icon"><IconSearch size={16} /></span>
          <input
            type="search"
            placeholder="Search by seller name or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="select-filter-wrapper">
          <select
            className="select-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Waste Types</option>
            <option value="plastic">Plastic</option>
            <option value="food">Food</option>
            <option value="metal">Metal</option>
          </select>
        </div>

        <div className="select-filter-wrapper">
          <select
            className="select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="available">Available only</option>
            <option value="sold">Sold only</option>
          </select>
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
          <h3>No listings found</h3>
          <p>No marketplace post matches your current search criteria.</p>
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
                  <th>Seller</th>
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
                        <span className={`badge waste-${typeCls}`}>
                          {item.wasteType || "Waste"}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.weightKg} kg</td>
                      <td style={{ fontWeight: 700, color: "var(--brand-700)" }}>
                        Rs. {item.totalPrice != null ? item.totalPrice.toLocaleString() : "0"}
                      </td>
                      <td>{item.sellerName || "—"}</td>
                      <td>
                        <span className={`badge status-${item.status}`}>
                          {item.status}
                        </span>
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

      {!loading && hasMore && (
        <button type="button" className="load-more-btn" onClick={loadMore}>
          Load more listings
        </button>
      )}
    </section>
  );
}
