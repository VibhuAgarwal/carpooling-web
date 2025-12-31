import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthOptions } from "next-auth";
import { prisma } from "./prisma";
import { createHash, timingSafeEqual } from "crypto";

type StoredUser = {
  email: string;
  salt: string;
  passwordHash: string;
};

declare global {
  var __carpool_users: Map<string, StoredUser> | undefined;
}

function getUserStore() {
  if (!globalThis.__carpool_users) globalThis.__carpool_users = new Map<string, StoredUser>();
  return globalThis.__carpool_users;
}

function hashPassword(password: string, salt: string) {
  return createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

function safeEqualHex(a: string, b: string) {
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email ?? "").toString().trim().toLowerCase();
        const password = (credentials?.password ?? "").toString();

        if (!email || !password) return null;

        // NOTE: This matches the current /api/auth/register implementation (in-memory).
        // Replace with DB-backed verification when you persist credentials in Prisma.
        const store = getUserStore();
        const u = store.get(email);
        if (!u) return null;

        const computed = hashPassword(password, u.salt);
        if (!safeEqualHex(computed, u.passwordHash)) return null;

        return {
          id: email, // NextAuth requires an id
          email,
          name: email.split("@")[0] || "User",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // On first sign-in, NextAuth provides `user`. On subsequent requests, only `token` is available.
      // We ensure the token always carries the fields our UI and API rely on.
      const email = (user?.email ?? token.email)?.toString().trim().toLowerCase();

      if (!email) return token;

      // Only hit the DB when we need to (initial sign-in or missing userId).
      const needsDb = Boolean(user?.email) || !token.userId;

      if (needsDb) {
        const userImage =
          user &&
          "image" in user &&
          typeof (user as unknown as Record<string, unknown>).image === "string"
            ? ((user as unknown as Record<string, unknown>).image as string)
            : undefined;

        let dbUser = await prisma.user.findUnique({
          where: { email },
        });

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email,
              name: user?.name || (token.name as string) || "User",
              image:
                userImage ||
                (typeof token.picture === "string" ? token.picture : undefined),
            },
          });
        }

        token.userId = dbUser.id;
        token.email = dbUser.email;
        token.name = dbUser.name ?? token.name;
        token.picture = (dbUser.image as string | null) ?? (token.picture as string | undefined);
      } else {
        // Keep token.email normalized even when we skip DB.
        token.email = email;
      }

      return token;
    },

    async session({ session, token }) {
      if (!session.user) return session;

      // Keep session.user consistent across providers.
      if (token.userId) session.user.id = token.userId as string;
      if (token.email) session.user.email = token.email as string;
      if (token.name) session.user.name = token.name as string;
      if (token.picture) session.user.image = token.picture as string;

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Respect explicit callbackUrl (/dashboard etc). Middleware handles profile completion.
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },
};
