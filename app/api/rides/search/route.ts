import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { from, to, date } = await req.json();

  if (!from || !to) {
    return NextResponse.json([], { status: 400 });
  }

  const RADIUS = 0.3; // ~30km

const rides = await prisma.ride.findMany({
  where: {
    status: "ACTIVE",

    // ✅ START location match
    fromLat: {
      not: null,
      gte: from.lat - RADIUS,
      lte: from.lat + RADIUS,
    },
    fromLng: {
      not: null,
      gte: from.lng - RADIUS,
      lte: from.lng + RADIUS,
    },

    // ✅ DESTINATION match (THIS WAS MISSING)
    toLat: {
      not: null,
      gte: to.lat - RADIUS,
      lte: to.lat + RADIUS,
    },
    toLng: {
      not: null,
      gte: to.lng - RADIUS,
      lte: to.lng + RADIUS,
    },

    startTime: date
      ? {
          gte: new Date(date),
          lt: new Date(new Date(date).setHours(23, 59, 59)),
        }
      : undefined,
  },
  include: {
    driver: {
      select: { name: true, image: true },
    },
  },
  take: 20,
});


  return NextResponse.json(rides);
}
