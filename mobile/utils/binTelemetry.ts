import type { BinCompartment, BinData, WasteType } from '../types';

/**
 * The ESP32 firmware writes to Realtime Database as:
 *
 *   bins/bin001/compartments/{plastic|food|metal}/{ level, weight }
 *   bins/bin001/lastUpdated
 *
 * where `level` is text ("EMPTY", "50%", "75%", "FULL", or "ERROR" when a
 * sensor fails) and `weight` is in grams. This module turns that raw shape
 * into the BinData the rest of the app already uses (numeric level %, a
 * status string, weight in kg), so screens don't each parse firmware text.
 */

/** Firmware weight unit -> kg. If a known weight on the scale reads 1000x too big or small, change this. */
export const WEIGHT_UNIT_DIVISOR = 1000;

/** Data older than this is treated as "bin offline" (the firmware uploads every few seconds). */
export const STALE_AFTER_MS = 2 * 60 * 1000;

const TYPES: WasteType[] = ['plastic', 'food', 'metal'];

type RawCompartment = { level?: unknown; weight?: unknown; overweight?: unknown } | undefined | null;

/*
 * Reads the fill level.
 * In: a number (45) or text ('EMPTY', 'FULL', '50%', 'ERROR').
 * Out: { level: 0-100, status: label }. Example: '50%' gives { level: 50, status: 'HALF' }.
 */
export function parseLevel(raw: unknown): { level: number; status: string } {
  if (typeof raw === 'number' && Number.isFinite(raw)) return fromPercent(raw);

  const text = String(raw ?? '').trim().toUpperCase();
  if (text === 'EMPTY') return { level: 0, status: 'EMPTY' };
  if (text === 'FULL') return { level: 100, status: 'FULL' };

  const m = /^(\d+(?:\.\d+)?)\s*%?$/.exec(text);
  if (m) return fromPercent(parseFloat(m[1]));

  // "ERROR", missing, or anything unexpected: a sensor problem, not a reading.
  return { level: 0, status: 'ERROR' };
}

// Picks a status label from a percent. Level is kept between 0 and 100.
function fromPercent(p: number): { level: number; status: string } {
  const level = Math.max(0, Math.min(100, p));
  if (level >= 100) return { level, status: 'FULL' };
  if (level >= 75) return { level, status: '75%' };
  if (level >= 50) return { level, status: 'HALF' };
  if (level > 0) return { level, status: 'LOW' };
  return { level, status: 'EMPTY' };
}

/*
 * Turns a raw weight (grams) into kilograms, rounded to 3 decimals.
 * Example: 1500 gives 1.5. Bad or negative values give 0.
 */
export function parseWeightKg(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? ''));
  if (!Number.isFinite(n) || n <= 0) return 0; // load cells drift slightly negative at rest
  return Math.round((n / WEIGHT_UNIT_DIVISOR) * 1000) / 1000;
}

/** The firmware's `overweight` flag: true means the compartment is over its weight limit, false is normal. */
export function parseOverweight(raw: unknown): boolean {
  return raw === true || (typeof raw === 'string' && raw.trim().toLowerCase() === 'true');
}

// Cleans one compartment. A missing compartment becomes an empty, normal one.
function normalizeCompartment(raw: RawCompartment): BinCompartment {
  if (!raw) return { level: 0, weight: 0, overweight: false };
  const { level, status } = parseLevel(raw.level);
  return { level, status, weight: parseWeightKg(raw.weight), overweight: parseOverweight(raw.overweight) };
}

/** Raw `bins/<id>` value from the firmware -> BinData. Returns null when there is no data. */
export function normalizeBin(raw: unknown): BinData | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const comps = (obj.compartments ?? obj) as Record<string, RawCompartment>;

  const bin = {
    lastUpdated: toEpochMs(obj.lastUpdated),
    location: typeof obj.location === 'string' ? obj.location : undefined,
  } as BinData;
  for (const t of TYPES) bin[t] = normalizeCompartment(comps[t]);
  return bin;
}

/** Accepts epoch seconds, epoch milliseconds or a date string; returns ms, or null if unusable. */
export function toEpochMs(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return raw < 1e12 ? raw * 1000 : raw;
  }
  if (typeof raw === 'string' && raw.trim()) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n < 1e12 ? n * 1000 : n;
    const t = Date.parse(raw);
    if (!Number.isNaN(t)) return t;
  }
  return null;
}

/*
 * Says if the bin data is recent.
 * In: the last update time (ms) and optionally 'now' (handy for tests).
 * Out: { live: true/false, label: text }. Example label: 'Updated 3 min ago'.
 */
export function describeFreshness(lastUpdated: number | null | undefined, now: number = Date.now()) {
  if (!lastUpdated) return { live: false, label: 'No update time reported' };
  const age = Math.max(0, now - lastUpdated);
  const live = age <= STALE_AFTER_MS;
  return { live, label: `${live ? 'Updated' : 'Last update'} ${formatAge(age)}` };
}

/*
 * Turns a time gap in milliseconds into friendly text.
 * Examples: 3000 gives 'just now', 90000 gives '1 min ago'.
 */
export function formatAge(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.floor(h / 24)} days ago`;
}
