import { describe, it, expect } from "vitest";
import { filterUsers, filterListings, filterOrders, filterBins, groupListingsBySeller, filterSellers, groupOrdersByUser, filterPeople, orderUsersAdminsFirst } from "./filters";

describe("filterUsers", () => {
  const users = [
    { id: "1", fullName: "Kesh Adhikari", email: "kesh@example.com", role: "seller" },
    { id: "2", fullName: "Nuwan Perera", email: "nuwan@example.com", role: "buyer" },
    { id: "3", fullName: "Admin User", email: "admin@example.com", role: "admin" },
  ];

  it("returns everyone with default options", () => {
    expect(filterUsers(users)).toHaveLength(3);
  });

  it("filters by role", () => {
    expect(filterUsers(users, { role: "seller" })).toEqual([users[0]]);
  });

  it("filters by name, case-insensitively", () => {
    expect(filterUsers(users, { search: "nuwan" })).toEqual([users[1]]);
  });

  it("filters by email substring", () => {
    expect(filterUsers(users, { search: "admin@" })).toEqual([users[2]]);
  });

  it("combines role and search filters", () => {
    expect(filterUsers(users, { role: "buyer", search: "kesh" })).toEqual([]);
  });
});

describe("filterListings", () => {
  const listings = [
    { id: "1", sellerName: "Kesh", wasteType: "plastic", status: "available" },
    { id: "2", sellerName: "Nuwan", wasteType: "food", status: "sold" },
  ];

  it("filters by status", () => {
    expect(filterListings(listings, { status: "sold" })).toEqual([listings[1]]);
  });

  it("filters by waste type", () => {
    expect(filterListings(listings, { wasteType: "plastic" })).toEqual([listings[0]]);
  });

  it("filters by seller name search", () => {
    expect(filterListings(listings, { search: "nuwan" })).toEqual([listings[1]]);
  });
});

describe("filterOrders", () => {
  const orders = [
    { id: "1", buyerName: "Kesh", sellerName: "Nuwan", status: "pending" },
    { id: "2", buyerName: "Amal", sellerName: "Kamal", status: "completed" },
  ];

  it("filters by status", () => {
    expect(filterOrders(orders, { status: "completed" })).toEqual([orders[1]]);
  });

  it("matches either buyer or seller name", () => {
    expect(filterOrders(orders, { search: "kamal" })).toEqual([orders[1]]);
    expect(filterOrders(orders, { search: "nuwan" })).toEqual([orders[0]]);
  });

  it("returns nothing when nothing matches", () => {
    expect(filterOrders(orders, { search: "nobody" })).toEqual([]);
  });
});

describe("filterBins", () => {
  const items = [
    { id: "bin001", owner: "user001", bin: { location: "Horizon Campus" } },
    { id: "bin002", owner: "user002", bin: { location: "Colombo Fort" } },
    { id: "bin003", bin: {} },
  ];
  const summaries = {
    bin001: { live: true, attention: false },
    bin002: { live: false, attention: true },
    bin003: { live: true, attention: true },
  };

  it("searches by id, location and owner", () => {
    expect(filterBins(items, summaries, { search: "fort" }).map((b) => b.id)).toEqual(["bin002"]);
    expect(filterBins(items, summaries, { search: "BIN003" }).map((b) => b.id)).toEqual(["bin003"]);
    expect(filterBins(items, summaries, { search: "user001" }).map((b) => b.id)).toEqual(["bin001"]);
  });

  it("filters by on, off and needs attention", () => {
    expect(filterBins(items, summaries, { status: "on" }).map((b) => b.id)).toEqual(["bin001", "bin003"]);
    expect(filterBins(items, summaries, { status: "off" }).map((b) => b.id)).toEqual(["bin002"]);
    expect(filterBins(items, summaries, { status: "attention" }).map((b) => b.id)).toEqual(["bin002", "bin003"]);
  });
});

describe("groupListingsBySeller", () => {
  const listings = [
    { id: "1", sellerUid: "s2", sellerName: "Nimal", status: "available", totalPrice: 100 },
    { id: "2", sellerUid: "s1", sellerName: "Kamal", status: "sold", totalPrice: 7.2 },
    { id: "3", sellerUid: "s2", sellerName: "Nimal", status: "sold", totalPrice: 50 },
    { id: "4", sellerUid: "s2", sellerName: "Nimal", status: "available", totalPrice: 25.5 },
  ];

  it("groups by seller with counts and total value, sorted by name", () => {
    const groups = groupListingsBySeller(listings);
    expect(groups.map((g) => g.sellerName)).toEqual(["Kamal", "Nimal"]);
    expect(groups[1]).toEqual({ sellerUid: "s2", sellerName: "Nimal", total: 3, available: 2, sold: 1, value: 175.5 });
    expect(groups[0]).toMatchObject({ total: 1, available: 0, sold: 1, value: 7.2 });
  });

  it("copes with listings that have no seller", () => {
    expect(groupListingsBySeller([{ id: "x", status: "available", totalPrice: 5 }])[0].sellerName).toBe("Unknown seller");
  });

  it("filters sellers by name", () => {
    const groups = groupListingsBySeller(listings);
    expect(filterSellers(groups, "nim").map((g) => g.sellerUid)).toEqual(["s2"]);
    expect(filterSellers(groups, "").length).toBe(2);
  });
});

describe("groupOrdersByUser", () => {
  const orders = [
    { id: "1", buyerUid: "b1", buyerName: "Amal", sellerUid: "s1", sellerName: "Nimal", status: "completed", totalPrice: 100 },
    { id: "2", buyerUid: "b1", buyerName: "Amal", sellerUid: "s1", sellerName: "Nimal", status: "pending", totalPrice: 50 },
    { id: "3", buyerUid: "b2", buyerName: "Kamal", sellerUid: "s1", sellerName: "Nimal", status: "cancelled", totalPrice: 20 },
    { id: "4", buyerUid: "b1", buyerName: "Amal", sellerUid: "s1", sellerName: "Nimal", status: "confirmed", totalPrice: 5 },
  ];

  it("counts each order once for its buyer and once for its seller", () => {
    const people = groupOrdersByUser(orders);
    expect(people.map((p) => p.name)).toEqual(["Amal", "Kamal", "Nimal"]);
    const amal = people.find((p) => p.uid === "b1");
    expect(amal).toMatchObject({ role: "buyer", total: 3, ongoing: 2, completed: 1, cancelled: 0, value: 100 });
    const nimal = people.find((p) => p.uid === "s1");
    expect(nimal).toMatchObject({ role: "seller", total: 4, ongoing: 2, completed: 1, cancelled: 1, value: 100 });
  });

  it("skips orders with no user id and filters people by name", () => {
    expect(groupOrdersByUser([{ id: "x", status: "pending" }])).toEqual([]);
    const people = groupOrdersByUser(orders);
    expect(filterPeople(people, "nim").map((p) => p.uid)).toEqual(["s1"]);
    expect(filterPeople(people, "").length).toBe(3);
  });
});

describe("orderUsersAdminsFirst", () => {
  const users = [
    { id: "3", fullName: "Zed", role: "buyer" },
    { id: "1", fullName: "Amal", role: "seller" },
    { id: "2", fullName: "Boss", role: "admin" },
  ];

  it("puts admins first, then the rest by name", () => {
    expect(orderUsersAdminsFirst(users).map((u) => u.id)).toEqual(["2", "1", "3"]);
  });

  it("adds admin accounts that are not in the loaded page, without duplicating", () => {
    const result = orderUsersAdminsFirst(users, [{ id: "2", fullName: "Boss", role: "admin" }, { id: "9", fullName: "Late", role: "admin" }]);
    expect(result.map((u) => u.id)).toEqual(["2", "9", "1", "3"]);
  });
});

describe("search by short id", () => {
  it("finds a user by their USR code", () => {
    const users = [
      { id: "JSErfAcDVJXt", fullName: "Kesh", email: "k@x.com", role: "seller" },
      { id: "AbCdEfGhIjKl", fullName: "Nuwan", email: "n@x.com", role: "buyer" },
    ];
    expect(filterUsers(users, { search: "USR-JSERFA" }).map((u) => u.fullName)).toEqual(["Kesh"]);
    expect(filterUsers(users, { search: "abcdef" }).map((u) => u.fullName)).toEqual(["Nuwan"]);
  });

  it("finds the people in an order by its ORD code", () => {
    const orders = [
      { id: "Q1w2E3r4", buyerUid: "b1", buyerName: "Amal", sellerUid: "s1", sellerName: "Nimal", status: "pending", totalPrice: 5 },
      { id: "Z9y8X7w6", buyerUid: "b2", buyerName: "Kamal", sellerUid: "s1", sellerName: "Nimal", status: "pending", totalPrice: 5 },
    ];
    const people = groupOrdersByUser(orders);
    expect(filterPeople(people, "ORD-Q1W2E3").map((p) => p.uid).sort()).toEqual(["b1", "s1"]);
    expect(filterOrders(orders, { search: "ord-z9y8x7" }).map((o) => o.id)).toEqual(["Z9y8X7w6"]);
  });
});
