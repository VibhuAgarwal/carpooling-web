import polyline from "@mapbox/polyline";

type Point = { lat: number; lng: number };

export function decodePolyline(encoded: string): Point[] {
  return polyline.decode(encoded).map(([lat, lng]) => ({ lat, lng }));
}

export function distanceKm(a: Point, b: Point): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function findClosestIndex(
  route: Point[],
  point: Point,
  radiusKm: number
): number {
  let closest = -1;
  let min = Infinity;

  route.forEach((p, i) => {
    const d = distanceKm(p, point);
    if (d < min && d <= radiusKm) {
      min = d;
      closest = i;
    }
  });

  return closest;
}
