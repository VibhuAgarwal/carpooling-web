import { NextResponse } from "next/server";
import { createHash, randomBytes, timingSafeEqual } from "crypto";

type StoredUser = {
  email: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __carpool_users: Map<string, StoredUser> | undefined;
}

function getUserStore() {
  if (!globalThis.__carpool_users) globalThis.__carpool_users = new Map<string, StoredUser>();
  return globalThis.__carpool_users;
}

function isValidEmail(email: string) {
  // Simple sanity check (not exhaustive)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashPassword(password: string, salt: string) {
  // NOTE: For production, prefer bcrypt/argon2 via a real user DB.
  return createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

// Optional helper (not used yet) for future credential verification
export function verifyPassword(password: string, salt: string, expectedHash: string) {
  const actual = hashPassword(password, salt);
  return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expectedHash, "hex"));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { email?: unknown; password?: unknown }
      | null;

    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const store = getUserStore();
    if (store.has(email)) {
      return NextResponse.json(
        { error: "User already exists." },
        { status: 409 }
      );
    }

    const salt = randomBytes(16).toString("hex");
    const passwordHash = hashPassword(password, salt);

    store.set(email, {
      email,
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
}
