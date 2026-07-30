/**
 * NextAuth.js Configuration — Google OAuth
 *
 * Provides per-user authentication and data isolation.
 * Each Google sign-in creates a unique user record in Neon PostgreSQL.
 */

import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      // Attach the database user ID to the session so API routes can scope data
      if (session.user) {
        (session.user as any).id = user.id;
      }
      return session;
    },
  },
};
