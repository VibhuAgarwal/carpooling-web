import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.userId) {
    return NextResponse.json([], { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: token.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notifications);
}
