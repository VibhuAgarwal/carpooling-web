import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/bookings
 * Create booking + notifications
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // 🔐 Auth
    if (!token?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { rideId, seats } = await req.json();

    if (!rideId || !seats || seats < 1) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    // ✅ Resolve DB user
    const user = await prisma.user.findUnique({
      where: { email: token.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 400 }
      );
    }

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      return NextResponse.json(
        { error: "Ride not found" },
        { status: 404 }
      );
    }

    if (ride.driverId === user.id) {
      return NextResponse.json(
        { error: "Cannot book your own ride" },
        { status: 403 }
      );
    }

    // 🚫 Prevent duplicate booking
    const existing = await prisma.booking.findFirst({
      where: {
        rideId,
        userId: user.id,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already requested this ride" },
        { status: 400 }
      );
    }

    // ✅ Create booking
    const booking = await prisma.booking.create({
      data: {
        rideId,
        userId: user.id,
        seats: Number(seats),
        status: "PENDING",
      },
    });

    // 🔔 USER notification
    await prisma.notification.create({
  data: {
    userId: user.id,
    type: "BOOKING_SENT",
    message: `Booking request sent for ${ride.from} → ${ride.to}`,
  },
});

await prisma.notification.create({
  data: {
    userId: ride.driverId,
    type: "BOOKING_RECEIVED",
    message: `New booking request from ${user.name} for ${ride.from} → ${ride.to}`,
  },
});

    return NextResponse.json(booking, { status: 201 });
  } catch (err) {
    console.error("BOOKING ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings
 * User's bookings
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.email) {
      return NextResponse.json([], { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: token.email },
    });

    if (!user) {
      return NextResponse.json([], { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
      },
      include: {
        ride: {
          select: {
            from: true,
            to: true,
            startTime: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(bookings);
  } catch (err) {
    console.error("FETCH BOOKINGS ERROR:", err);
    return NextResponse.json([], { status: 500 });
  }
}
