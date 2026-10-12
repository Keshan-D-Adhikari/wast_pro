// Place search for the seller's bin location screen.
// Flow: user types -> placeSuggestUrl builds the URL -> searchPlaces fetches it ->
// parsePlaces cleans the answer into a list the screen can show.

/**
 * Suggest companies and places by name while the user types, so a seller can
 * choose where the smart bin is instead of using GPS. Uses Photon (komoot), a
 * free OpenStreetMap search built for type-ahead; no API key. Results are limited
 * to Sri Lanka. The caller waits for a short pause in typing before asking, so
 * the service is not hit on every keystroke.
 */
// One suggestion in the list: a name, a readable address and its coordinates.
export type PlaceResult = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

// The parts of Photon's answer we use. Everything is optional because we do not trust the API.
type PhotonFeature = {
  geometry?: { coordinates?: unknown };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    county?: string;
    state?: string;
  };
};

/** Turns Photon's GeoJSON into clean results, dropping entries without usable coordinates and duplicates. */
// In: the raw JSON from Photon. Out: a clean list (empty list if the data is bad).
export function parsePlaces(json: unknown): PlaceResult[] {
  // GeoJSON puts the places in a 'features' array.
  const features = (json as { features?: unknown })?.features;
  if (!Array.isArray(features)) return [];

  const results: PlaceResult[] = [];
  const seen = new Set<string>();
  for (const f of features as PhotonFeature[]) {
    // GeoJSON order is [longitude, latitude] (note: longitude comes first).
    const coords = f?.geometry?.coordinates;
    if (!Array.isArray(coords)) continue;
    const longitude = Number(coords[0]);
    const latitude = Number(coords[1]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    // Skip impossible coordinates.
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) continue;

    // Build a readable address like '12 Main Street, Colombo, Western Province'.
    const p = f.properties ?? {};
    const streetLine = [p.housenumber, p.street].filter(Boolean).join(' ');
    const parts = [streetLine, p.city, p.county, p.state].filter((x): x is string => !!x && x.trim() !== '');
    const address = parts.join(', ');
    // Prefer the place name, otherwise the first address part.
    const name = String(p.name ?? '').trim() || parts[0] || 'Selected place';

    // The same place often appears as both a node and a building
    // Remove duplicates by comparing name and address in lower case.
    const key = `${name.toLowerCase()}|${address.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ name, address, latitude, longitude });
  }
  return results;
}

// Rough bounding box around Sri Lanka: west, south, east, north
// The box keeps results inside Sri Lanka.
const SRI_LANKA_BBOX = '79.4,5.8,82.0,9.9';

// Builds the Photon search URL. encodeURIComponent makes the text safe for a URL
// (for example a space becomes %20). 'limit=6' asks for at most 6 results.
export function placeSuggestUrl(text: string): string {
  const q = encodeURIComponent(text.trim());
  return `https://photon.komoot.io/api/?q=${q}&limit=6&lang=en&bbox=${SRI_LANKA_BBOX}`;
}

// In: the typed text and an optional AbortSignal (lets the screen cancel an old request
// when the user keeps typing). Out: a list of places. Throws if the server fails.
export async function searchPlaces(text: string, signal?: AbortSignal): Promise<PlaceResult[]> {
  const trimmed = text.trim();
  // Too short to search, avoid useless requests.
  if (trimmed.length < 3) return [];
  const response = await fetch(placeSuggestUrl(trimmed), {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) throw new Error(`Place search failed (${response.status})`);
  return parsePlaces(await response.json());
}
