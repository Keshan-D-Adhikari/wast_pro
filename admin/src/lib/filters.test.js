import { describe, it, expect } from "vitest";
import { filterUsers, filterListings, filterOrders } from "./filters";

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
