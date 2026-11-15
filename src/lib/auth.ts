import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { UserRole } from "@prisma/client";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

const USER_REVALIDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 menit

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Kredensial tidak valid");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error("Kredensial tidak valid");
        }
        
        if (user.isActive === false) {
          throw new Error("Akun ini telah dinonaktifkan. Silakan hubungi Administrator.");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Kredensial tidak valid");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.isActive = true;
        token.checkedAt = Date.now();
        return token;
      }

      if (
        token.id &&
        (!token.checkedAt || Date.now() - token.checkedAt > USER_REVALIDATE_INTERVAL_MS)
      ) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: { role: true, isActive: true },
          });
          if (!dbUser || !dbUser.isActive) {
            token.isActive = false;
          } else {
            token.role = dbUser.role;
            token.isActive = true;
          }
          token.checkedAt = Date.now();
        } catch {
          // Biarkan token tetap dipakai jika database sedang transient error
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.isActive === false) {
        throw new Error("Akun telah dinonaktifkan");
      }
      if (token && session.user) {
        session.user.role = (token.role as UserRole) || "VIEWER";
        session.user.id = (token.id as string) || "";
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  pages: {
    signIn: "/login",
  }
};
