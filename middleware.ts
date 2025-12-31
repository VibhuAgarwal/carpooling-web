import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Never touch NextAuth routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Allow profile completion page and login
  if (pathname === "/auth/complete-profile" || pathname === "/login") {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Protect routes - redirect unauthenticated users to login
  if (!token && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Logged-in users shouldn't see login page
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Check if authenticated user has completed profile
  if (token && pathname !== "/auth/complete-profile") {
    try {
      const user = await prisma.user.findUnique({
        where: { email: token.email as string },
        select: {
          phone: true,
          aadhaarNumber: true,
          panNumber: true,
          drivingLicenseNumber: true,
        },
      });

      const isProfileComplete =
        user?.phone &&
        user?.aadhaarNumber &&
        user?.panNumber &&
        user?.drivingLicenseNumber;

      // Redirect to profile completion if incomplete (except for protected routes)
      if (!isProfileComplete && !pathname.startsWith("/api")) {
        return NextResponse.redirect(
          new URL("/auth/complete-profile", req.url)
        );
      }
    } catch (err) {
      console.error("Middleware profile check error:", err);
      // Continue on error
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/profile/:path*",
    "/my-rides/:path*",
    "/my-bookings/:path*",
    "/ride/:path*",
    "/bookings/:path*",
    "/dashboard/:path*",
    "/notifications/:path*",
    "/api/:path*",
  ],
};

