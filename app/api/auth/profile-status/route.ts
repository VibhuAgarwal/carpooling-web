import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";

  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        { isProfileComplete: false, ...(isDev ? { reason: "NO_TOKEN" } : {}) },
        { status: 401 }
      );
    }

    if (!token.email) {
      return NextResponse.json(
        { isProfileComplete: false, ...(isDev ? { reason: "NO_EMAIL_ON_TOKEN" } : {}) },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: token.email },
      select: {
        phone: true,
        gender: true,
        dateOfBirth: true,
        address: true,
        aadhaarNumber: true,
        panNumber: true,
        drivingLicenseNumber: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { isProfileComplete: false, ...(isDev ? { reason: "USER_NOT_FOUND" } : {}) },
        { status: 404 }
      );
    }

    const isProfileComplete =
      !!user.phone &&
      !!user.gender &&
      !!user.dateOfBirth &&
      !!user.address &&
      !!user.aadhaarNumber &&
      !!user.panNumber &&
      !!user.drivingLicenseNumber;

    return NextResponse.json({ isProfileComplete });
  } catch (err) {
    console.error("PROFILE STATUS ERROR:", err);
    return NextResponse.json(
      { isProfileComplete: false, ...(isDev ? { reason: "SERVER_ERROR" } : {}) },
      { status: 500 }
    );
  }
}