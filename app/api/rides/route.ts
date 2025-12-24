import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      from,
      fromLat,
      fromLng,
      to,
      toLat,
      toLng,
      seatsTotal,
      startTime,
    } = await req.json();

    if (
      !from ||
      !to ||
      !fromLat ||
      !fromLng ||
      !toLat ||
      !toLng ||
      !seatsTotal ||
      !startTime
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const ride = await prisma.ride.create({
      data: {
        driverId: token.userId,
        from,
        fromLat,
        fromLng,
        to,
        toLat,
        toLng,
        seatsTotal: Number(seatsTotal),
        seatsLeft: Number(seatsTotal),
        startTime: new Date(startTime),
        status: "ACTIVE",
      },
    });

    return NextResponse.json(ride);
  } catch (err) {
    console.error("CREATE RIDE ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
