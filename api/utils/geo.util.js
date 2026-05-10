const EARTH_RADIUS_METERS = 6_371_000;

/**
 * Haversine distance between two lat/lng points in metres.
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

/**
 * Returns true when the coordinate is within `radiusMeters` of the site.
 */
export function isWithinRadius(lat, lng, siteLat, siteLng, radiusMeters) {
  return haversineDistance(lat, lng, siteLat, siteLng) <= radiusMeters;
}
