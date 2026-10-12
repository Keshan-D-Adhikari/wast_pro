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

// Number (percent) -> { level, status }. Example: 80 -> { level: 80, status: "75%" }.
// The level is limited to 0..100, then matched to a status word:
// 100 = FULL, 75 and up = "75%", 50 and up = HALF, above 0 = LOW, else EMPTY.
function fromPercent(p) {
  const level = Math.max(0, Math.min(100, p));
  if (level >= 100) return { level, status: "FULL" };
  if (level >= 75) return { level, status: "75%" };
  if (level >= 50) return { level, status: "HALF" };
  if (level > 0) return { level, status: "LOW" };
  return { level, status: "EMPTY" };
}

// Reads the level the firmware sends. In: 50, "50%", "FULL", "EMPTY" or junk.
// Out: { level, status }. Example: "75%" -> { level: 75, status: "75%" }.
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

// Grams -> kilograms. Example: 2400 -> 2.4. Bad or negative input gives 0.
// The result is rounded to 3 decimals so the display has no long tails.
export function parseWeightKg(raw) {
  const n = typeof raw === "number" ? raw : parseFloat(String(raw ?? ""));
  if (!Number.isFinite(n) || n <= 0) return 0; // load cells drift slightly negative at rest
  return Math.round((n / WEIGHT_UNIT_DIVISOR) * 1000) / 1000;
}

/** Accepts epoch seconds, epoch milliseconds or a date string; returns ms, or null if unusable. */
// Example: 1700000000 (seconds) -> 1700000000000 (ms); "2026-09-30 04:30:00" -> its ms value.
// A number below 1e12 is treated as seconds, so it is multiplied by 1000.
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

/** The firmware's `overweight` flag: true means the compartment is over its weight limit, false is normal. */
// In: true or "true" (any case). Out: true. Everything else gives false.
export function parseOverweight(raw) {
  return raw === true || (typeof raw === "string" && raw.trim().toLowerCase() === "true");
}

// One compartment from the raw data -> { level, status, weight (kg), overweight }.
// A missing compartment becomes an empty one, so the screen never crashes.
function normalizeCompartment(raw) {
  if (!raw) return { level: 0, weight: 0, overweight: false };
  const { level, status } = parseLevel(raw.level);
  return { level, status, weight: parseWeightKg(raw.weight), overweight: parseOverweight(raw.overweight) };
}

/** Raw `bins/<id>` value from the firmware -> { plastic, food, metal, lastUpdated, location }, or null. */
// Some firmware versions put compartments under raw.compartments, others directly on raw.
// `comps` handles both. The loop below fills bin.plastic, bin.food and bin.metal.
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

// Milliseconds -> short text. Examples: 3000 -> "just now", 90000 -> "1 min ago",
// 7200000 -> "2 h ago". After 48 hours it counts days.
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

// In: last update time (ms) and the current time (now can be passed in for tests).
// Out: { live, label }. A bin is "live" if it reported within STALE_AFTER_MS (2 minutes).
// Example label: "Updated 5s ago" or "Last update 3 h ago".
export function describeFreshness(lastUpdated, now = Date.now()) {
  if (!lastUpdated) return { live: false, label: "No update time reported" };
  const age = Math.max(0, now - lastUpdated);
  const live = age <= STALE_AFTER_MS;
  return { live, label: `${live ? "Updated" : "Last update"} ${formatAge(age)}` };
}

/** Every bin under the IoT database's `bins` node -> a sorted list of { id, owner, bin }. */
// Each bin object also keeps `owner` (a user id, if the firmware wrote one).
// Bins without usable data are dropped. The sort uses numeric:true so bin2 comes before bin10.
export function normalizeBins(rawBins) {
  if (!rawBins || typeof rawBins !== "object") return [];
  return Object.entries(rawBins)
    .map(([id, raw]) => ({
      id,
      owner: typeof raw?.owner === "string" ? raw.owner : undefined,
      bin: normalizeBin(raw),
    }))
    .filter((b) => b.bin)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

/** One-line state of a bin for the list: is it reporting, how full is the fullest compartment, does it need attention. */
// maxLevel = the fullest compartment. attention = true if any compartment is FULL or overweight.
// Used by the bin list to show badges and to filter.
export function summarizeBin(bin, now = Date.now()) {
  const comps = ["plastic", "food", "metal"].map((t) => bin[t] || {});
  const maxLevel = Math.max(0, ...comps.map((c) => Number(c.level) || 0));
  const attention = comps.some((c) => c.overweight || (c.status || "").toUpperCase() === "FULL");
  return { live: describeFreshness(bin.lastUpdated, now).live, maxLevel, attention };
}
