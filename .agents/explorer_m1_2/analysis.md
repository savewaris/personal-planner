# NextAuth.js App Router Architecture & Registration Endpoint Analysis

**Target Workspace**: `d:/save/Antigravity/Planner`  
**Author**: Explorer Subagent (`explorer_m1_2`)  
**Date**: 2026-07-21  

---

## Executive Summary

This report provides a comprehensive architectural blueprint for implementing NextAuth.js in Next.js 16 (App Router) for the **Planner** application. It details:
1. Catch-all Route Handler setup at `src/app/api/auth/[...nextauth]/route.ts`.
2. Auth configuration module at `src/lib/auth.ts` integrating Prisma Adapter, Credentials (bcrypt), Google OAuth, GitHub OAuth, and Email Magic Links.
3. Database schema modifications required in `prisma/schema.prisma` for NextAuth models (`Account`, `Session`, `VerificationToken`, and `User.password`).
4. JWT & Session callback strategy for passing custom user metadata (`userId`) across server components and API routes.
5. RESTful User Registration endpoint specification for `src/app/api/auth/register/route.ts` with input validation, password hashing, existing user conflict handling, and automatic default workspace context provision.

---

## 1. Next.js App Router API Route Handler Architecture

In the Next.js App Router (Next.js 13+ / 16), all NextAuth endpoints (`/api/auth/signin`, `/api/auth/callback/*`, `/api/auth/session`, `/api/auth/csrf`, `/api/auth/providers`, `/api/auth/signout`) are handled via dynamic catch-all route handlers.

### 1.1 Dynamic Catch-All Handler: `src/app/api/auth/[...nextauth]/route.ts`
```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### 1.2 Prisma Singleton Helper: `src/lib/prisma.ts`
To prevent multiple `PrismaClient` instances during Hot Module Replacement (HMR) in Next.js development:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## 2. Prisma Database Schema Requirements (`prisma/schema.prisma`)

NextAuth requires standard models for OAuth account linking, session management, magic link tokens, and credentials hashing.

### Updated Schema Specification:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // or "sqlite" based on environment
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?   // Hashed password for CredentialsProvider (null for OAuth/MagicLink users)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  contexts      Context[]
  habits        Habit[]
}

model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Context {
  id        String    @id @default(uuid())
  name      String
  color     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  projects  Project[]
  tasks     Task[]

  @@index([userId])
}

model Project {
  id          String    @id @default(uuid())
  name        String
  description String?
  links       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  contextId   String
  context     Context   @relation(fields: [contextId], references: [id], onDelete: Cascade)

  tasks       Task[]

  @@index([contextId])
}

model Task {
  id          String    @id @default(uuid())
  title       String
  description String?
  completed   Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  contextId   String
  context     Context   @relation(fields: [contextId], references: [id], onDelete: Cascade)

  projectId   String?
  project     Project?  @relation(fields: [projectId], references: [id], onDelete: SetNull)

  @@index([contextId])
  @@index([projectId])
}

model Habit {
  id          String    @id @default(uuid())
  name        String
  streak      Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  logs        HabitLog[]

  @@index([userId])
}

model HabitLog {
  id          String    @id @default(uuid())
  date        DateTime  @default(now())
  completed   Boolean   @default(true)
  
  habitId     String
  habit       Habit     @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@index([habitId])
}
```

---

## 3. Auth Configuration Specification (`src/lib/auth.ts`)

### 3.1 NextAuth Options & Providers Setup
```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    // Crucial: CredentialsProvider requires JWT strategy in NextAuth.js
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // 1. Credentials Provider (Email & Password)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),

    // 2. Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),

    // 3. GitHub OAuth Provider
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),

    // 4. Email Magic Links Provider
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM || "Planner App <noreply@example.com>",
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

### 3.2 Key Architectural Decision: `strategy: "jwt"` with PrismaAdapter
- **Rule**: When `CredentialsProvider` is registered in NextAuth.js, database sessions are not natively managed by `CredentialsProvider`. Therefore, setting `session: { strategy: "jwt" }` is **mandatory**.
- **Impact**: PrismaAdapter still handles creation of `Account` records for Google/GitHub OAuth logins and `VerificationToken` records for Email Magic Links. Session state itself is encoded and signed in an HTTP-only JWT cookie.

### 3.3 TypeScript Module Augmentation (`src/types/next-auth.d.ts`)
```typescript
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
```

---

## 4. User Registration API Endpoint Design (`src/app/api/auth/register/route.ts`)

### 4.1 Functional Requirements
- Endpoint: `POST /api/auth/register`
- Content-Type: `application/json`
- Action: Register a new user with Email and Password for Credentials sign-in.
- Side Effect: Automatically creates an initial default "Personal" workspace `Context` for the newly registered user.

### 4.2 API Specification & Code Blueprint
```typescript
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    // 1. Validation: Required fields
    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.toLowerCase().trim();

    // 2. Validation: Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // 3. Validation: Password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // 4. Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 409 }
      );
    }

    // 5. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 6. Transaction: Create user & default context
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name ? name.trim() : null,
          email: trimmedEmail,
          password: hashedPassword,
        },
      });

      // Seed initial default context for user workspace
      await tx.context.create({
        data: {
          name: "Personal",
          color: "#3B82F6", // Default blue theme
          userId: user.id,
        },
      });

      return user;
    });

    // 7. Return success response (excluding hashed password)
    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
        message: "User registered successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration" },
      { status: 500 }
    );
  }
}
```

---

## 5. Required Dependencies & Environment Configuration

### 5.1 NPM Package Dependencies
- `next-auth@^4.24.5` (or `@auth/core` / `next-auth@beta`)
- `@next-auth/prisma-adapter@^1.0.7`
- `@prisma/client@^5.0.0`
- `bcryptjs@^2.4.3`
- `nodemailer@^6.9.0` (for EmailProvider)
- Dev Dependencies: `prisma`, `@types/bcryptjs`, `@types/nodemailer`

### 5.2 Required Environment Variables (`.env`)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/planner_db?schema=public"

# NextAuth Global Settings
NEXTAUTH_SECRET="super-secret-random-jwt-hash-key-32-chars+"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (Optional in dev if not testing OAuth)
GOOGLE_CLIENT_ID="google-client-id"
GOOGLE_CLIENT_SECRET="google-client-secret"
GITHUB_CLIENT_ID="github-client-id"
GITHUB_CLIENT_SECRET="github-client-secret"

# Email Provider (Magic Links)
EMAIL_SERVER="smtp://user:pass@smtp.mailtrap.io:2525"
EMAIL_FROM="Planner App <noreply@example.com>"
```

---

## 6. Verification Strategy & Test Cases

1. **Jest Integration Tests**:
   - `tests/jest/auth-register.test.ts`: Mock `prisma` and test `POST /api/auth/register` for 201 Success, 400 Missing Fields, 400 Invalid Email, 400 Short Password, 409 Existing Email.
   - `tests/jest/auth-options.test.ts`: Test `authorize` function in CredentialsProvider with correct bcrypt matching and incorrect password handling.
2. **Playwright E2E Tests**:
   - `tests/e2e/auth-flow.spec.ts`: Test navigating to `/login`, switching to sign-up mode, submitting credentials, redirecting to dashboard `/`, and verifying session persistence.
