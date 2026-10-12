// Distance between two GPS points. Used to show how far a buyer is from a seller's bin.
//
// Haversine in simple words: the Earth is a ball, so a straight line on a flat map is wrong.
// This formula measures the shortest path along the curved surface.
// Steps: (1) find the difference in latitude and longitude, in radians,
// (2) turn the differences into 'a' (a number between 0 and 1 describing the gap),
// (3) turn 'a' into an angle 'c' between the points as seen from the Earth's centre,
// (4) distance = Earth radius * angle.

/** Great-circle distance between two lat/lon points, in kilometres (Haversine formula). */
export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  // Earth radius in km.
  const R = 6371;
  // Degrees to radians: multiply by PI / 180. Maths functions need radians.
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  // The Haversine core: sin^2(dLat/2) + cos(lat1) * cos(lat2) * sin^2(dLon/2).
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  // Convert 'a' to the angle between the points.
  const c = 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );
  // Arc length = radius * angle (in km).
  return R * c;
}
