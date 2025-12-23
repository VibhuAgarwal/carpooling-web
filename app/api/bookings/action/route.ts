import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, action, reason } = await req.json();

    if (!bookingId || !action) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { ride: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Only driver of the ride can act
    if (booking.ride.driverId !== token.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent double actions
    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "Booking already processed" },
        { status: 400 }
      );
    }

    if (action === "ACCEPT") {
      if (booking.ride.seatsLeft < booking.seats) {
        return NextResponse.json(
          { error: "Not enough seats" },
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
  prisma.notification.create({
    data: {
      userId: booking.userId,
      type: "BOOKING_ACCEPTED",
      message: `Your booking for ${booking.ride.from} → ${booking.ride.to} was accepted.`,
    },
  }),
]);


    if (action === "REJECT") {
      await prisma.$transaction([
  prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "REJECTED",
      reason: reason || null,
    },
  }),
  prisma.notification.create({
    data: {
      userId: booking.userId,
      type: "BOOKING_REJECTED",
      message: `Your booking for ${booking.ride.from} → ${booking.ride.to} was rejected.${reason ? " Reason: " + reason : ""}`,
    },
  }),
]);

  }}
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("BOOKING ACTION ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
