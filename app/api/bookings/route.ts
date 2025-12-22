import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rideId, seats } = await req.json();

  const booking = await prisma.booking.create({
    data: {
      rideId,
      userId: session.user.id,
      seats,
    },
  });

  return NextResponse.json(booking);
}
