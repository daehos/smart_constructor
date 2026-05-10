export const SITE = Object.freeze({
  name: process.env.SITE_NAME ?? "Klapa Village",
  /** Optional subtitle for map UI (e.g. area / address line). */
  area: (process.env.SITE_AREA ?? "").trim() || undefined,
  lat: Number(process.env.SITE_LAT ?? "-6.2615"),
  lng: Number(process.env.SITE_LNG ?? "106.9335"),
  radiusMeters: Number(process.env.SITE_RADIUS_METERS ?? "100"),
});
