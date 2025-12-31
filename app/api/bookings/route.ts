import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getIO } from "@/lib/socket";

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

    // 👤 Resolve DB user
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

    if (Number(seats) > ride.seatsTotal) {
      return NextResponse.json(
        { error: "Requested seats exceed ride capacity" },
        { status: 400 }
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

    // 🔔 Notifications (DB = source of truth)
    await prisma.notification.createMany({
      data: [
        {
          userId: user.id,
          type: "BOOKING_SENT",
          message: `Booking request sent for ${ride.from} → ${ride.to} to driver`,
        },
        {
          userId: ride.driverId,
          type: "BOOKING_RECEIVED",
          message: `New booking request received for ${ride.from} → ${ride.to} from ${user.name}`,
        },
      ],
    });

    // 🔴 Socket (BEST-EFFORT, NEVER FAIL API)
    let io;
    try {
      io = getIO();
    } catch {
      io = null;
    }

    io?.to(`user:${ride.driverId}`).emit("booking:new", {
      bookingId: booking.id,
      rideId: ride.id,
      userId: user.id,
      seats: booking.seats,
      from: ride.from,
      to: ride.to,
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
            driver: { select: { phone: true } }, // ✅ fetch driver phone from User table
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // ✅ Only expose phone AFTER acceptance
    const safe = bookings.map((b) => ({
      ...b,
      ride: {
        ...b.ride,
        driver:
          b.status === "ACCEPTED"
            ? { phone: b.ride.driver?.phone ?? null }
            : { phone: null },
      },
    }));

    return NextResponse.json(safe);
  } catch (err) {
    console.error("FETCH BOOKINGS ERROR:", err);
    return NextResponse.json([], { status: 500 });
  }
}
