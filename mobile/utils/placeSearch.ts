/**
 * Search for a company or place by name, so a buyer can type where the smart bin
 * is kept instead of using GPS. Uses OpenStreetMap's free Nominatim search (no
 * API key); results are limited to Sri Lanka. Nominatim asks for light use, so
 * the app only searches when the user taps Search (never while typing).
 */
export type PlaceResult = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

type NominatimItem = {
  lat?: string;
  lon?: string;
  name?: string;
  display_name?: string;
};

/** Turns Nominatim's JSON into clean results, dropping any entry without usable coordinates. */
export function parsePlaces(items: unknown): PlaceResult[] {
  if (!Array.isArray(items)) return [];
  const results: PlaceResult[] = [];
  for (const raw of items as NominatimItem[]) {
    const latitude = Number(raw?.lat);
    const longitude = Number(raw?.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) continue;
    const address = String(raw.display_name ?? '').trim();
    const name = String(raw.name ?? '').trim() || address.split(',')[0].trim() || 'Selected place';
    results.push({ name, address, latitude, longitude });
  }
  return results;
}

export function placeSearchUrl(text: string): string {
  const q = encodeURIComponent(text.trim());
  return `https://nominatim.openstreetmap.org/search?q=${q}&format=jsonv2&limit=6&countrycodes=lk&addressdetails=0`;
}

export async function searchPlaces(text: string): Promise<PlaceResult[]> {
  const trimmed = text.trim();
  if (trimmed.length < 3) return [];
  const response = await fetch(placeSearchUrl(trimmed), {
    headers: { Accept: 'application/json', 'User-Agent': 'SmartWastePro/1.0 (student project)' },
  });
  if (!response.ok) throw new Error(`Place search failed (${response.status})`);
  return parsePlaces(await response.json());
}
