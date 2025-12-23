import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
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

  const { rideId, seats } = await req.json();

  if (!rideId || !seats || seats < 1) {
    return NextResponse.json(
      { error: "Invalid request" },
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

  if (ride.driverId === token.userId) {
    return NextResponse.json(
      { error: "Cannot book your own ride" },
      { status: 403 }
    );
  }

  const booking = await prisma.booking.create({
    data: {
      rideId,
      userId: token.userId,
      seats,
      status: "PENDING",
    },
  });

  return NextResponse.json(booking, { status: 201 });
}
export async function GET(req: Request) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.userId) {
    return NextResponse.json([], { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      userId: token.userId,
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
}

