import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.userId) return NextResponse.json([], { status: 401 });

  const cars = await prisma.car.findMany({
    where: { userId: token.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, make: true, model: true, plateNumber: true, color: true, seats: true },
  });

  return NextResponse.json(cars);
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);

  const make = String(body?.make ?? "").trim();
  const model = String(body?.model ?? "").trim();
  const plateNumber = String(body?.plateNumber ?? "").trim().toUpperCase();
  const color = body?.color ? String(body.color).trim() : null;
  const seats = body?.seats == null || body?.seats === "" ? null : Number(body.seats);

  if (!make || !model || !plateNumber) {
    return NextResponse.json({ error: "Missing required fields: make, model, plateNumber" }, { status: 400 });
  }
  if (seats !== null && (!Number.isFinite(seats) || seats < 1 || seats > 12)) {
    return NextResponse.json({ error: "Invalid seats" }, { status: 400 });
  }

  try {
    const car = await prisma.car.create({
      data: { userId: token.userId, make, model, plateNumber, color, seats },
      select: { id: true, make: true, model: true, plateNumber: true, color: true, seats: true },
    });
    return NextResponse.json(car, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not add car (maybe duplicate plate number)." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.car.deleteMany({ where: { id, userId: token.userId } });
  return NextResponse.json({ ok: true });
}
