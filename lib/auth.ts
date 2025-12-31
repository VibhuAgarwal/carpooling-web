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
  // eslint-disable-next-line no-var
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
      if (user?.email) {
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "User",
              image: (user as any).image,
            },
          });
        }

        token.userId = dbUser.id;
        token.email = user.email;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
      }
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
