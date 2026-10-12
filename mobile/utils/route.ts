/**
 * Road route between two points, from OSRM's free public routing service (no API key).
 * The buyer's pickup map draws it; if the service is unreachable the map falls back
 * to a straight dashed line.
 */
export type LatLng = { latitude: number; longitude: number };

export type RoadRoute = {
  points: LatLng[];
  distanceKm: number;
  durationMin: number;
};

/** Turns OSRM's JSON into a route, or null when there is no usable route. */
// In: raw JSON from OSRM. Out: a RoadRoute, or null if anything is missing or invalid.
export function parseRoute(json: unknown): RoadRoute | null {
  const route = (json as { code?: string; routes?: unknown[] })?.routes?.[0] as
    | { distance?: number; duration?: number; geometry?: { coordinates?: unknown } }
    | undefined;
  if ((json as { code?: string })?.code !== 'Ok' || !route) return null;

  const coords = route.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;

  const points: LatLng[] = [];
  for (const c of coords) {
    if (!Array.isArray(c)) continue;
    const longitude = Number(c[0]);
    const latitude = Number(c[1]);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) points.push({ latitude, longitude });
  }
  if (points.length < 2) return null;

  const distance = Number(route.distance);
  const duration = Number(route.duration);
  return {
    points,
    distanceKm: Number.isFinite(distance) ? distance / 1000 : 0,
    durationMin: Number.isFinite(duration) ? duration / 60 : 0,
  };
}

// Builds the OSRM request URL. Note OSRM wants 'longitude,latitude' order.
// 'geometries=geojson' gives us a simple list of points.
export function routeUrl(from: LatLng, to: LatLng): string {
  return (
    'https://router.project-osrm.org/route/v1/driving/' +
    `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
    '?overview=full&geometries=geojson'
  );
}

// Asks OSRM for the route. Returns null on any server error so the map can use a straight line.
export async function fetchRoadRoute(from: LatLng, to: LatLng, signal?: AbortSignal): Promise<RoadRoute | null> {
  const response = await fetch(routeUrl(from, to), { headers: { Accept: 'application/json' }, signal });
  if (!response.ok) return null;
  return parseRoute(await response.json());
}
