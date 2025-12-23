import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(
  _: Request,
  { params }: { params: { rideId: string } }
) {
  const token = await getToken({ secret: process.env.NEXTAUTH_SECRET });

  if (!token?.userId) {
    return NextResponse.json(null, { status: 401 });
  }

  const ride = await prisma.ride.findUnique({
    where: { id: params.rideId },
    include: {
      bookings: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!ride || ride.driverId !== token.userId) {
    return NextResponse.json(null, { status: 403 });
  }

  return NextResponse.json(ride);
}
