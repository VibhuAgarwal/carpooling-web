import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.email) {
      return NextResponse.json(
        { isProfileComplete: false },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: token.email },
    });

    if (!user) {
      return NextResponse.json(
        { isProfileComplete: false },
        { status: 404 }
      );
    }

    // Check if all required fields are filled
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
      { isProfileComplete: false },
      { status: 500 }
    );
  }
}