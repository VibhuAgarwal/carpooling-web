import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getRoutePolyline } from "@/lib/googleMaps";

/**
 * GET /api/rides
 * Fetch recent active rides (homepage)
 */
export async function GET() {
  try {
    const rides = await prisma.ride.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        driver: {
          select: { name: true, image: true },
        },
      },
    });

    return NextResponse.json(rides);
  } catch (err) {
    console.error("FETCH RIDES ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rides
 * Create a new ride
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const from = body.from;
    const to = body.to;

    const fromLat = Number(body.fromLat);
    const fromLng = Number(body.fromLng);
    const toLat = Number(body.toLat);
    const toLng = Number(body.toLng);

    const seatsTotal = Number(body.seatsTotal);
    const startTime = body.startTime;

    // 🔴 HARD VALIDATION
    if (
      !from ||
      !to ||
      [fromLat, fromLng, toLat, toLng].some(
        (v) => Number.isNaN(v)
      ) ||
      Number.isNaN(seatsTotal) ||
      !startTime
    ) {
      return NextResponse.json(
        { error: "Invalid or missing fields" },
        { status: 400 }
      );
    }

    console.log("COORD TYPES:", {
      fromLat,
      fromLng,
      toLat,
      toLng,
      types: [
        typeof fromLat,
        typeof fromLng,
        typeof toLat,
        typeof toLng,
      ],
    });

    // ✅ ALWAYS calculate route
    const polyline = await getRoutePolyline(
      fromLat,
      fromLng,
      toLat,
      toLng
    );

    if (!polyline) {
      return NextResponse.json(
        { error: "Route could not be calculated" },
        { status: 400 }
      );
    }

    const ride = await prisma.ride.create({
      data: {
        driverId: token.userId,
        from,
        fromLat: Number(fromLat),
        fromLng: Number(fromLng),
        to,
        toLat: Number(toLat),
        toLng: Number(toLng),
        routePolyline: polyline,
        seatsTotal: Number(seatsTotal),
        seatsLeft: seatsTotal,
        startTime: new Date(startTime),
        status: "ACTIVE",
      },
    });

    return NextResponse.json(ride, { status: 201 });
  } catch (err) {
    console.error("CREATE RIDE ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
