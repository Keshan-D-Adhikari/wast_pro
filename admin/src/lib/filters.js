/** Shared row-filtering helpers, pulled out of the table pages so they're testable in isolation. */

export function filterUsers(users, { search = "", role = "all" } = {}) {
  const term = search.trim().toLowerCase();
  return users.filter((u) => {
    const matchesRole = role === "all" || u.role === role;
    const matchesTerm =
      !term ||
      u.fullName?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term);
    return matchesRole && matchesTerm;
  });
}

export function filterListings(listings, { search = "", status = "all", wasteType = "all" } = {}) {
  const term = search.trim().toLowerCase();
  return listings.filter((item) => {
    const matchesStatus = status === "all" || item.status === status;
    const matchesType = wasteType === "all" || item.wasteType === wasteType;
    const matchesTerm = !term || item.sellerName?.toLowerCase().includes(term);
    return matchesStatus && matchesType && matchesTerm;
  });
}

export function filterOrders(orders, { search = "", status = "all" } = {}) {
  const term = search.trim().toLowerCase();
  return orders.filter((o) => {
    const matchesStatus = status === "all" || o.status === status;
    const matchesTerm =
      !term ||
      o.buyerName?.toLowerCase().includes(term) ||
      o.sellerName?.toLowerCase().includes(term);
    return matchesStatus && matchesTerm;
  });
}
