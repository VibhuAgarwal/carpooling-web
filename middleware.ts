import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Never touch NextAuth
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Protect everything except login
  if (!token && pathname !== "/login") {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  // Logged-in users shouldn't see login
  if (token && pathname === "/login") {
    return NextResponse.redirect(
      new URL("/", req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/my-rides",
    "/my-bookings",
    "/api/:path*",
  ],
};

