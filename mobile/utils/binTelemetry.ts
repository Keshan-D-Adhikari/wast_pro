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

type RawCompartment = { level?: unknown; weight?: unknown } | undefined | null;

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

function fromPercent(p: number): { level: number; status: string } {
  const level = Math.max(0, Math.min(100, p));
  if (level >= 100) return { level, status: 'FULL' };
  if (level >= 75) return { level, status: '75%' };
  if (level >= 50) return { level, status: 'HALF' };
  if (level > 0) return { level, status: 'LOW' };
  return { level, status: 'EMPTY' };
}

export function parseWeightKg(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? ''));
  if (!Number.isFinite(n) || n <= 0) return 0; // load cells drift slightly negative at rest
  return Math.round((n / WEIGHT_UNIT_DIVISOR) * 1000) / 1000;
}

function normalizeCompartment(raw: RawCompartment): BinCompartment {
  if (!raw) return { level: 0, weight: 0 };
  const { level, status } = parseLevel(raw.level);
  return { level, status, weight: parseWeightKg(raw.weight) };
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

export function describeFreshness(lastUpdated: number | null | undefined, now: number = Date.now()) {
  if (!lastUpdated) return { live: false, label: 'No update time reported' };
  const age = Math.max(0, now - lastUpdated);
  const live = age <= STALE_AFTER_MS;
  return { live, label: `${live ? 'Updated' : 'Last update'} ${formatAge(age)}` };
}

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
