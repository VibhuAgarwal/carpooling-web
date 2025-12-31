import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolved = await params;
  const id = String(resolved?.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const notification = await prisma.notification.findFirst({
    where: { id, userId: token.userId },
  });

  if (!notification) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(notification);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolved = await params;
  const id = String(resolved?.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const isRead = body?.isRead;

  if (typeof isRead !== "boolean") {
    return NextResponse.json({ error: "Invalid isRead" }, { status: 400 });
  }

  const result = await prisma.notification.updateMany({
    where: { id, userId: token.userId },
    data: { isRead },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}