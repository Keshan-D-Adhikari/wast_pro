import { describe, it, expect } from "vitest";
import { normalizeBin, parseLevel, parseWeightKg, toEpochMs, describeFreshness, formatAge, STALE_AFTER_MS } from "./binTelemetry";

describe("parseLevel", () => {
  it("maps the firmware level words and percentages", () => {
    expect(parseLevel("EMPTY")).toEqual({ level: 0, status: "EMPTY" });
    expect(parseLevel("50%")).toEqual({ level: 50, status: "HALF" });
    expect(parseLevel("75%")).toEqual({ level: 75, status: "75%" });
    expect(parseLevel("FULL")).toEqual({ level: 100, status: "FULL" });
  });
  it("treats ERROR, missing and unknown values as a sensor error", () => {
    expect(parseLevel("ERROR")).toEqual({ level: 0, status: "ERROR" });
    expect(parseLevel(undefined)).toEqual({ level: 0, status: "ERROR" });
  });
});

describe("parseWeightKg", () => {
  it("converts grams to kg and clamps drift", () => {
    expect(parseWeightKg(1500)).toBe(1.5);
    expect(parseWeightKg(-0.03088)).toBe(0);
    expect(parseWeightKg("abc")).toBe(0);
  });
});

describe("normalizeBin", () => {
  it("converts the real firmware shape", () => {
    const bin = normalizeBin({
      compartments: {
        food: { level: "ERROR", weight: 0.05105 },
        metal: { level: "EMPTY", weight: 0.01241 },
        plastic: { level: "FULL", weight: 3400 },
      },
      lastUpdated: 1790695315669,
      location: "Horizon Campus",
      owner: "user001",
    });
    expect(bin.plastic).toEqual({ level: 100, status: "FULL", weight: 3.4 });
    expect(bin.food.status).toBe("ERROR");
    expect(bin.lastUpdated).toBe(1790695315669);
    expect(bin.location).toBe("Horizon Campus");
  });
  it("returns null for no data", () => {
    expect(normalizeBin(null)).toBeNull();
  });
});

describe("freshness", () => {
  it("accepts seconds, ms and date strings", () => {
    expect(toEpochMs(1790695315)).toBe(1790695315000);
    expect(toEpochMs(1790695315669)).toBe(1790695315669);
    expect(toEpochMs(undefined)).toBeNull();
  });
  it("is live within two minutes and offline after", () => {
    const now = 1_000_000_000_000;
    expect(describeFreshness(now - 5000, now).live).toBe(true);
    expect(describeFreshness(now - STALE_AFTER_MS - 1, now).live).toBe(false);
    expect(describeFreshness(null, now).live).toBe(false);
  });
  it("formats ages", () => {
    expect(formatAge(30_000)).toBe("30s ago");
    expect(formatAge(11 * 86_400_000)).toBe("11 days ago");
  });
});
