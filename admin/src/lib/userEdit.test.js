import { describe, it, expect } from "vitest";
import { validateUserEdit } from "./userEdit";

describe("validateUserEdit", () => {
  it("accepts good values and trims them", () => {
    const r = validateUserEdit({ fullName: "  Kesh  ", phone: " 0771234567 ", location: "Colombo", points: "50" });
    expect(r.ok).toBe(true);
    expect(r.data).toEqual({ fullName: "Kesh", phone: "0771234567", location: "Colombo", points: 50 });
  });

  it("requires a name and keeps lengths within the database limits", () => {
    expect(validateUserEdit({ fullName: " ", phone: "", location: "", points: 0 }).errors.fullName).toBeTruthy();
    expect(validateUserEdit({ fullName: "x".repeat(81), phone: "", location: "", points: 0 }).errors.fullName).toBeTruthy();
    expect(validateUserEdit({ fullName: "A", phone: "1".repeat(21), location: "", points: 0 }).errors.phone).toBeTruthy();
    expect(validateUserEdit({ fullName: "A", phone: "", location: "x".repeat(81), points: 0 }).errors.location).toBeTruthy();
  });

  it("allows only whole, non-negative points up to a million; empty counts as 0", () => {
    const base = { fullName: "A", phone: "", location: "" };
    expect(validateUserEdit({ ...base, points: "" }).data.points).toBe(0);
    for (const bad of ["-1", "1.5", "abc", "1000001"]) {
      expect(validateUserEdit({ ...base, points: bad }).errors.points).toBeTruthy();
    }
  });
});
