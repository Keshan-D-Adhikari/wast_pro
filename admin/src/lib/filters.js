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

/** Rows for the bin list: `items` are { id, owner, bin } from normalizeBins, `summaries` maps id -> summarizeBin. */
export function filterBins(items, summaries, { search = "", status = "all" } = {}) {
  const term = search.trim().toLowerCase();
  return items.filter((item) => {
    const s = summaries[item.id];
    const matchesStatus =
      status === "all" ||
      (status === "on" && s?.live) ||
      (status === "off" && !s?.live) ||
      (status === "attention" && s?.attention);
    const matchesTerm =
      !term ||
      item.id.toLowerCase().includes(term) ||
      item.bin?.location?.toLowerCase().includes(term) ||
      item.owner?.toLowerCase().includes(term);
    return matchesStatus && matchesTerm;
  });
}

/** Listings grouped by seller: { sellerUid, sellerName, total, available, sold, value }, sorted by name. */
export function groupListingsBySeller(listings) {
  const groups = new Map();
  for (const item of listings) {
    const key = item.sellerUid || item.sellerName || "unknown";
    const g = groups.get(key) ?? {
      sellerUid: item.sellerUid || key,
      sellerName: item.sellerName || "Unknown seller",
      total: 0,
      available: 0,
      sold: 0,
      value: 0,
    };
    g.total += 1;
    if (item.status === "available") g.available += 1;
    if (item.status === "sold") g.sold += 1;
    g.value += Number(item.totalPrice) || 0;
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => a.sellerName.localeCompare(b.sellerName));
}

export function filterSellers(sellers, search = "") {
  const term = search.trim().toLowerCase();
  return sellers.filter((s) => !term || s.sellerName.toLowerCase().includes(term));
}

/**
 * Orders grouped by the people in them: every order counts once for its buyer and once for its
 * seller. Each person: { uid, name, role, total, ongoing, completed, cancelled, value } where
 * value is the total of their completed orders. Sorted by name.
 */
export function groupOrdersByUser(orders) {
  const people = new Map();
  const add = (uid, name, role, order) => {
    if (!uid) return;
    const p = people.get(uid) ?? { uid, name: name || "Unknown user", role, total: 0, ongoing: 0, completed: 0, cancelled: 0, value: 0 };
    p.total += 1;
    if (order.status === "completed") {
      p.completed += 1;
      p.value += Number(order.totalPrice) || 0;
    } else if (order.status === "cancelled") {
      p.cancelled += 1;
    } else {
      p.ongoing += 1;
    }
    people.set(uid, p);
  };
  for (const o of orders) {
    add(o.buyerUid, o.buyerName, "buyer", o);
    add(o.sellerUid, o.sellerName, "seller", o);
  }
  return [...people.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function filterPeople(people, search = "") {
  const term = search.trim().toLowerCase();
  return people.filter((p) => !term || p.name.toLowerCase().includes(term));
}
