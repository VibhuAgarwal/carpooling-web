import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

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
      ride: {
        driverId: token.userId,
      },
    },
    include: {
      user: {
        select: { name: true, email: true },
      },
      ride: {
        select: { from: true, to: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bookings);
}
