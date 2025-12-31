import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import polyline from "@mapbox/polyline";

// simple haversine distance (km)
function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
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

export async function POST(req: NextRequest) {
  const { from, to } = await req.json();

  if (!from || !to) {
    return NextResponse.json([], { status: 400 });
  }

  // 1️⃣ Fetch candidate rides (broad filter only)
  const rides = await prisma.ride.findMany({
    where: {
      status: "ACTIVE",
      routePolyline: { not: null },
    },
    include: {
      driver: {
        select: { name: true, image: true },
      },
    },
    take: 50, // keep reasonable
  });

  const PICKUP_RADIUS_KM = 25; // Gurgaon-scale
  const DROP_RADIUS_KM = 30;

  const matched = rides.filter((ride) => {
    if (!ride.routePolyline) return false;

    // 2️⃣ Decode route
    const routePoints = polyline
      .decode(ride.routePolyline)
      .map(([lat, lng]) => ({ lat, lng }));

    let pickupIndex = -1;
    let dropIndex = -1;

    // 3️⃣ Find pickup & drop positions on route
    for (let i = 0; i < routePoints.length; i++) {
      const p = routePoints[i];

      if (
        pickupIndex === -1 &&
        distanceKm(p, { lat: from.lat, lng: from.lng }) <= PICKUP_RADIUS_KM
      ) {
        pickupIndex = i;
      }

      if (
        pickupIndex !== -1 &&
        distanceKm(p, { lat: to.lat, lng: to.lng }) <= DROP_RADIUS_KM
      ) {
        dropIndex = i;
        break;
      }
    }

    // 4️⃣ Valid match only if pickup happens before drop
    if (pickupIndex === -1 || dropIndex === -1) return false;
    if (pickupIndex >= dropIndex) return false;

    return true;
  });

  return NextResponse.json(matched);
}
