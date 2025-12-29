import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.userId) {
      return NextResponse.json([], { status: 401 });
    }

    const rides = await prisma.ride.findMany({
      where: { driverId: token.userId },
      select: {
        id: true,        
        from: true,
        to: true,
        startTime: true,
        status: true,
        seatsLeft: true,
        seatsTotal: true,
      },
    });

    return NextResponse.json(rides);
  } catch (err) {
    console.error("MY RIDES ERROR:", err);
    return NextResponse.json([], { status: 500 });
  }
}
