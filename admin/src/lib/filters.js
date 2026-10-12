import { matchesCode, orderCode, userCode } from "./shortId";

// Every filter works the same way: lowercase and trim the search text, then keep a row
// only if it passes the dropdown (status / role / type) AND the search text.
// "all" means "do not filter on this".
/** Shared row-filtering helpers, pulled out of the table pages so they're testable in isolation. */

// Users page. In: the users list and { search, role }. Out: the matching users.
// Search matches name, email or the short code (USR-XXXXXX).
export function filterUsers(users, { search = "", role = "all" } = {}) {
  const term = search.trim().toLowerCase();
  return users.filter((u) => {
    const matchesRole = role === "all" || u.role === role;
    const matchesTerm =
      !term ||
      u.fullName?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      matchesCode(userCode(u.id), term);
    return matchesRole && matchesTerm;
  });
}

// Marketplace page. Keeps listings that match status, waste type and the seller name search.
export function filterListings(listings, { search = "", status = "all", wasteType = "all" } = {}) {
  const term = search.trim().toLowerCase();
  return listings.filter((item) => {
    const matchesStatus = status === "all" || item.status === status;
    const matchesType = wasteType === "all" || item.wasteType === wasteType;
    const matchesTerm = !term || item.sellerName?.toLowerCase().includes(term);
    return matchesStatus && matchesType && matchesTerm;
  });
}

// Orders page. Keeps orders by status; search matches buyer, seller or order code (ORD-XXXXXX).
// The ?. is optional chaining: it gives undefined instead of an error if the field is missing.
export function filterOrders(orders, { search = "", status = "all" } = {}) {
  const term = search.trim().toLowerCase();
  return orders.filter((o) => {
    const matchesStatus = status === "all" || o.status === status;
    const matchesTerm =
      !term ||
      o.buyerName?.toLowerCase().includes(term) ||
      o.sellerName?.toLowerCase().includes(term) ||
      matchesCode(orderCode(o.id), term);
    return matchesStatus && matchesTerm;
  });
}

// Status "on" = reporting recently, "off" = offline, "attention" = full or overweight.
// Search matches the bin id, its location text or its owner.
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

// Uses a Map (key -> value) to collect one row per seller while looping over listings.
// Example: 3 listings by Ann (2 available, 1 sold) -> one group with total 3, available 2, sold 1,
// and value = the sum of totalPrice.
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

// Search sellers by name or by the short user code.
export function filterSellers(sellers, search = "") {
  const term = search.trim().toLowerCase();
  return sellers.filter(
    (s) => !term || s.sellerName.toLowerCase().includes(term) || matchesCode(userCode(s.sellerUid), term)
  );
}

/**
 * Orders grouped by the people in them: every order counts once for its buyer and once for its
 * seller. Each person: { uid, name, role, total, ongoing, completed, cancelled, value } where
 * value is the total of their completed orders. Sorted by name.
 */
// The Map is keyed by user id, so one person who is both buyer and seller keeps one row.
export function groupOrdersByUser(orders) {
  const people = new Map();
  const add = (uid, name, role, order) => {
    if (!uid) return;
    const p = people.get(uid) ?? { uid, name: name || "Unknown user", role, total: 0, ongoing: 0, completed: 0, cancelled: 0, value: 0, orderIds: [] };
    p.total += 1;
    p.orderIds.push(order.id);
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

// Search people by name, user code, or by the code of any of their orders.
export function filterPeople(people, search = "") {
  const term = search.trim().toLowerCase();
  return people.filter(
    (p) =>
      !term ||
      p.name.toLowerCase().includes(term) ||
      matchesCode(userCode(p.uid), term) ||
      (p.orderIds || []).some((id) => matchesCode(orderCode(id), term))
  );
}

// A Map keyed by id removes duplicates: admin accounts replace the same user from the page.
// Sort: admins first (rank 0), then everyone else, each group by name (or email).
/** Merges the paginated users with the admin accounts and puts admins first, then everyone else by name. */
export function orderUsersAdminsFirst(users, admins = []) {
  const byId = new Map(users.map((u) => [u.id, u]));
  for (const a of admins) byId.set(a.id, a);
  return [...byId.values()].sort((a, b) => {
    const rank = (u) => (u.role === "admin" ? 0 : 1);
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    return (a.fullName || a.email || "").localeCompare(b.fullName || b.email || "");
  });
}
