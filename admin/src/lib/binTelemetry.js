/**
 * The ESP32 firmware writes to Realtime Database as:
 *   bins/bin001/compartments/{plastic|food|metal}/{ level, weight }
 *   bins/bin001/lastUpdated
 * `level` is text ("EMPTY", "50%", "75%", "FULL", or "ERROR" when a sensor fails)
 * and `weight` is in grams. This turns it into { level %, status, weight kg }.
 * Keep in sync with mobile/utils/binTelemetry.ts.
 */

/** Firmware weight unit -> kg. If a known weight reads 1000x off, change this. */
export const WEIGHT_UNIT_DIVISOR = 1000;

/** Data older than this is treated as "bin offline" (the firmware uploads every few seconds). */
export const STALE_AFTER_MS = 2 * 60 * 1000;

const TYPES = ["plastic", "food", "metal"];

function fromPercent(p) {
  const level = Math.max(0, Math.min(100, p));
  if (level >= 100) return { level, status: "FULL" };
  if (level >= 75) return { level, status: "75%" };
  if (level >= 50) return { level, status: "HALF" };
  if (level > 0) return { level, status: "LOW" };
  return { level, status: "EMPTY" };
}

export function parseLevel(raw) {
  if (typeof raw === "number" && Number.isFinite(raw)) return fromPercent(raw);

  const text = String(raw ?? "").trim().toUpperCase();
  if (text === "EMPTY") return { level: 0, status: "EMPTY" };
  if (text === "FULL") return { level: 100, status: "FULL" };

  const m = /^(\d+(?:\.\d+)?)\s*%?$/.exec(text);
  if (m) return fromPercent(parseFloat(m[1]));

  // "ERROR", missing, or anything unexpected: a sensor problem, not a reading.
  return { level: 0, status: "ERROR" };
}

export function parseWeightKg(raw) {
  const n = typeof raw === "number" ? raw : parseFloat(String(raw ?? ""));
  if (!Number.isFinite(n) || n <= 0) return 0; // load cells drift slightly negative at rest
  return Math.round((n / WEIGHT_UNIT_DIVISOR) * 1000) / 1000;
}

/** Accepts epoch seconds, epoch milliseconds or a date string; returns ms, or null if unusable. */
export function toEpochMs(raw) {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return raw < 1e12 ? raw * 1000 : raw;
  }
  if (typeof raw === "string" && raw.trim()) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n < 1e12 ? n * 1000 : n;
    const t = Date.parse(raw);
    if (!Number.isNaN(t)) return t;
  }
  return null;
}

function normalizeCompartment(raw) {
  if (!raw) return { level: 0, weight: 0 };
  const { level, status } = parseLevel(raw.level);
  return { level, status, weight: parseWeightKg(raw.weight) };
}

/** Raw `bins/<id>` value from the firmware -> { plastic, food, metal, lastUpdated, location }, or null. */
export function normalizeBin(raw) {
  if (!raw || typeof raw !== "object") return null;
  const comps = raw.compartments ?? raw;
  const bin = {
    lastUpdated: toEpochMs(raw.lastUpdated),
    location: typeof raw.location === "string" ? raw.location : undefined,
  };
  for (const t of TYPES) bin[t] = normalizeCompartment(comps[t]);
  return bin;
}

export function formatAge(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.floor(h / 24)} days ago`;
}

export function describeFreshness(lastUpdated, now = Date.now()) {
  if (!lastUpdated) return { live: false, label: "No update time reported" };
  const age = Math.max(0, now - lastUpdated);
  const live = age <= STALE_AFTER_MS;
  return { live, label: `${live ? "Updated" : "Last update"} ${formatAge(age)}` };
}
