import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

// NOTE: adjust this import to wherever your NextAuth `authOptions` lives.
import { authOptions } from "@/lib/auth";

// NOTE: adjust this import to your Prisma client location.
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);

  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true, // ensure your User model has `phone`; otherwise rename to your actual column
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user, { status: 200 });
}
