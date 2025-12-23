import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.userId) {
      console.error("MODE API: No token");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { mode } = await req.json();

    if (mode !== "PASSENGER" && mode !== "DRIVER") {
      return NextResponse.json(
        { error: "Invalid mode" },
        { status: 400 }
      );
    }

    if (mode === "DRIVER" && !token.canDrive) {
      return NextResponse.json(
        { error: "Driver capability not enabled" },
        { status: 403 }
      );
    }

    await prisma.user.update({
      where: { id: token.userId },
      data: { lastActiveMode: mode },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("MODE API ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
