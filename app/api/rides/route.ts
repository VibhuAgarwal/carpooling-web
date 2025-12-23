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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { from, to, seatsTotal, startTime } = body;

    if (!from || !to || !seatsTotal || !startTime) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const ride = await prisma.ride.create({
  data: {
    from,
    to,
    seatsTotal: Number(seatsTotal),
    seatsLeft: Number(seatsTotal),
    startTime: new Date(startTime),
    driverId: token.userId,
    status: "ACTIVE", 
  },
});

    return NextResponse.json(ride, { status: 201 });
  } catch (err) {
    console.error("CREATE RIDE ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    return NextResponse.json([]);
  }
}


