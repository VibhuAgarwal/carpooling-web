import GoogleProvider from "next-auth/providers/google";
import { AuthOptions } from "next-auth";
import { prisma } from "./prisma";
import { cookies } from "next/headers";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (user?.email) {
        // Read role from cookie / first-login context
        const roleFromUI =
          token.role || (token).roleFromUI;

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        let dbUser;

        if (!existingUser) {
          // FIRST LOGIN → persist role
          const role =
            roleFromUI === "RIDER" ? "RIDER" : "USER";

          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "User",
              image: user.image,
              role,
            },
          });
        } else {
          // EXISTING USER → NEVER change role
          dbUser = existingUser;
        }

        token.userId = dbUser.id;
        token.role = dbUser.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
