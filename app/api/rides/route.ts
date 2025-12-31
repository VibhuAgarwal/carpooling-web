import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getRoutePolyline } from "@/lib/googleMaps";
import { Prisma } from "@prisma/client";

// ✅ Prisma must not run on Edge
export const runtime = "nodejs";

/**
 * GET /api/rides
 * Fetch recent active rides (homepage)
 */
export async function GET() {
  try {
    const rides = await prisma.ride.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        driver: { select: { name: true, image: true } },
        car: {
          select: {
            id: true,
            make: true,
            model: true,
            plateNumber: true,
            color: true,
            seats: true,
          },
        },
      },
    });

    return NextResponse.json(rides);
  } catch (err) {
    console.error("FETCH RIDES ERROR:", err);

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          error: "Database error",
          code: err.code,
          message: err.message,
          meta: (err as any).meta,
          hint:
            err.code === "P2022"
              ? "DB schema is out of date (missing column). Run `npx prisma migrate dev` + restart."
              : undefined,
        },
        { status: 500 }
      );
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        { error: "Prisma client validation error", message: err.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/rides
 * Create a new ride
 */
export async function POST(req: NextRequest) {
  let body: any = null;

  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    body = await req.json().catch(() => null);

    const from = body?.from;
    const to = body?.to;

    const fromLat = Number(body?.fromLat);
    const fromLng = Number(body?.fromLng);
    const toLat = Number(body?.toLat);
    const toLng = Number(body?.toLng);

    const seatsTotal = Number(body?.seatsTotal);
    const startTime = body?.startTime;

    // Resolve car: accept carId OR car details
    const rawCarId = String(body?.carId ?? "").trim();
    const rawCar = body?.car ?? null;

    const getCarFromId = async (carId: string) =>
      prisma.car.findFirst({
        where: { id: carId, userId: token.userId },
        select: { id: true, seats: true },
      });

    const upsertCarFromDetails = async (car: any) => {
      const make = String(car?.make ?? "").trim();
      const model = String(car?.model ?? "").trim();
      const plateNumber = String(car?.plateNumber ?? "").trim();
      const color = car?.color != null ? String(car.color) : null;

      const seats =
        car?.seats == null || car?.seats === ""
          ? null
          : Number(car.seats);

      if (!make || !model || !plateNumber) return null;
      if (seats != null && Number.isNaN(seats)) return null;

      return prisma.car.upsert({
        where: { userId_plateNumber: { userId: token.userId, plateNumber } },
        create: { userId: token.userId, make, model, plateNumber, color, seats },
        update: { make, model, color, seats },
        select: { id: true, seats: true },
      });
    };

    let car: { id: string; seats: number | null } | null = null;

    if (rawCarId) {
      car = await getCarFromId(rawCarId);
      if (!car) return NextResponse.json({ error: "Invalid car selected" }, { status: 400 });
    } else if (rawCar) {
      car = await upsertCarFromDetails(rawCar);
      if (!car) return NextResponse.json({ error: "Valid car details are required" }, { status: 400 });
    } else {
      return NextResponse.json({ error: "carId or car details are required" }, { status: 400 });
    }

    // HARD VALIDATION
    if (
      !from ||
      !to ||
      [fromLat, fromLng, toLat, toLng].some((v) => Number.isNaN(v)) ||
      Number.isNaN(seatsTotal) ||
      !startTime
    ) {
      return NextResponse.json({ error: "Invalid or missing fields" }, { status: 400 });
    }

    if (car.seats != null && seatsTotal > car.seats) {
      return NextResponse.json(
        { error: `seatsTotal exceeds selected car capacity (${car.seats})` },
        { status: 400 }
      );
    }

    const polyline = await getRoutePolyline(fromLat, fromLng, toLat, toLng);
    if (!polyline) {
      return NextResponse.json({ error: "Route could not be calculated" }, { status: 400 });
    }

    const ride = await prisma.ride.create({
      data: {
        driverId: token.userId,
        carId: car.id,

        from,
        fromLat,
        fromLng,
        to,
        toLat,
        toLng,
        routePolyline: polyline,
        seatsTotal,
        seatsLeft: seatsTotal,
        startTime: new Date(startTime),
        status: "ACTIVE",
      },
    });

    return NextResponse.json(ride, { status: 201 });
  } catch (err) {
    console.error("CREATE RIDE ERROR:", err);
    console.error("CREATE RIDE BODY (debug):", {
      from: body?.from,
      to: body?.to,
      seatsTotal: body?.seatsTotal,
      startTime: body?.startTime,
      carId: body?.carId,
      carPlateNumber: body?.car?.plateNumber,
    });

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          error: "Database error",
          code: err.code,
          message: err.message,
          meta: (err as any).meta,
          hint:
            err.code === "P2022"
              ? "DB schema is out of date (missing column). Run `npx prisma migrate dev` + restart."
              : undefined,
        },
        { status: 500 }
      );
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        {
          error: "Prisma client validation error (schema/client mismatch).",
          hint: "Run `npx prisma generate` and restart dev server.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
