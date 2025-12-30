import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rideId, withUserId } = await req.json().catch(() => ({}));
  if (!rideId || !withUserId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Provider integration point:
  // - create a proxy-call session (caller/callee never see each other’s numbers)
  // - return a short-lived join token / URL
  return NextResponse.json(
    { error: "Masked call provider not configured" },
    { status: 501 }
  );
}
