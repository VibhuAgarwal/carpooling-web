import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, action, reason } = await req.json();

    if (!bookingId || !action) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    // Get DB user (driver)
    const driver = await prisma.user.findUnique({
      where: { email: token.email },
    });

    if (!driver) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Load booking with ride
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { ride: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // 🔐 Authorization: only ride owner can act
    if (booking.ride.driverId !== driver.id) {
      return NextResponse.json(
        { error: "Not allowed" },
        { status: 403 }
      );
    }

    // Reject requires reason
    if (action === "REJECT" && !reason) {
      return NextResponse.json(
        { error: "Rejection reason required" },
        { status: 400 }
      );
    }

    // ✅ ACCEPT
    if (action === "ACCEPT") {
      if (booking.ride.seatsLeft < booking.seats) {
        return NextResponse.json(
          { error: "Not enough seats left" },
          { status: 400 }
        );
      }

      await prisma.$transaction([
        prisma.booking.update({
          where: { id: bookingId },
          data: { status: "ACCEPTED" },
        }),
        prisma.ride.update({
          where: { id: booking.rideId },
          data: {
            seatsLeft: {
              decrement: booking.seats,
            },
          },
        }),
      ]);

      // 🔔 USER notification (ACCEPTED)
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: "BOOKING_ACCEPTED",
          message: `Your booking for ${booking.ride.from} → ${booking.ride.to} was accepted`,
        },
      });
    }

    // ❌ REJECT
    if (action === "REJECT") {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "REJECTED",
          reason: reason,
        },
      });

      // 🔔 USER notification (REJECTED)
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          type: "BOOKING_REJECTED",
          message: `Your booking for ${booking.ride.from} → ${booking.ride.to} was rejected. Reason: ${reason}`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("BOOKING ACTION ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
