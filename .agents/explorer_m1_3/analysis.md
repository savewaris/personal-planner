# Auth UI Components & Session Provider Architecture Analysis

## 1. Executive Summary

This report provides the detailed design and implementation architecture for the **Authentication UI Components** and **Session Provider Integration** for the Planner Next.js application (Milestone 1).

The design covers three key components:
1. **`SessionProvider` Wrapper (`src/components/Providers.tsx`)**: Global client-side provider wrapper enabling NextAuth session context throughout the Next.js App Router tree.
2. **Login / Register UI Page (`src/app/login/page.tsx`)**: Tabbed authentication view supporting Credentials Login, Custom User Registration, Google OAuth, GitHub OAuth, and Passwordless Magic Links.
3. **Navbar Component (`src/components/Navbar.tsx`)**: Header component featuring brand navigation, Context Switcher placeholder (Milestone 2 integration point), loading state handling, and interactive user profile dropdown with sign-in/sign-out controls.

---

## 2. Session Provider Wrapper Component (`src/components/Providers.tsx`)

### Architecture & Design
- **Client Component Boundary**: In Next.js App Router, `src/app/layout.tsx` is a Server Component. NextAuth's `SessionProvider` utilizes React Context, requiring a `"use client"` directive.
- **Extensibility**: `Providers.tsx` acts as the root provider container. In Milestone 2, `ContextSwitcherProvider` will be nested alongside `SessionProvider` inside this wrapper without needing changes to `layout.tsx`.
- **Session Rehydration**: Optional `session` prop allows Server Components (like `layout.tsx` or page handlers) to pass pre-fetched server sessions directly into the client provider to eliminate flash of unauthenticated state.

### Component Design (`src/components/Providers.tsx`)

```tsx
"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}
```

### Integration in Root Layout (`src/app/layout.tsx`)

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Planner - Task & Habit Management",
  description: "Organize your tasks, habits, and contexts seamlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## 3. Login / Register UI Page (`src/app/login/page.tsx`)

### Architecture & Design
- **Multi-Method Support**: Tabbed navigation between:
  1. `Sign In` (Credentials Email + Password, with Google & GitHub OAuth buttons)
  2. `Sign Up` (Registration form: Name, Email, Password, Confirm Password)
  3. `Magic Link` (Passwordless email login)
- **Suspense Boundary for `useSearchParams`**: Next.js App Router requires wrapping hooks that read query parameters (like `useSearchParams()`) in a `<Suspense>` fallback to maintain static rendering optimizations.
- **Error Handling**: Reads NextAuth error parameters (`OAuthAccountNotLinked`, `CredentialsSignin`, `AccessDenied`) and displays user-friendly error alerts.
- **Client Validation & Feedback**: Form input validation, password match verification, loading spinner indicators (`isLoading`), and success messages (e.g. "Magic link sent! Check your inbox.").

### Component Design (`src/app/login/page.tsx`)

```tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";

type AuthTab = "signin" | "signup" | "magiclink";

function LoginFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const defaultTab = (searchParams?.get("tab") as AuthTab) || "signin";
  const urlError = searchParams?.get("error");
  const callbackUrl = searchParams?.get("callbackUrl") || "/";

  const [activeTab, setActiveTab] = useState<AuthTab>(defaultTab);
  
  // Credentials Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Registration Form State
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // UI Feedback States
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (urlError === "OAuthAccountNotLinked") {
      setError("To confirm your identity, sign in with the same account you used originally.");
    } else if (urlError === "CredentialsSignin") {
      setError("Invalid email or password. Please try again.");
    } else if (urlError) {
      setError("An error occurred during authentication. Please try again.");
    }
  }, [urlError]);

  // Handle Email/Password Login
  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setError("Invalid email or password.");
      } else if (res?.url) {
        router.push(res.url);
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle User Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to register user.");
      }

      setMessage("Registration successful! Logging you in...");

      // Automatically sign in after successful registration
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (signInRes?.url) {
        router.push(signInRes.url);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Magic Link Request
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const res = await signIn("email", {
        email,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setError("Could not send magic link. Please verify your email.");
      } else {
        setMessage("Magic link sent! Check your email inbox to complete sign in.");
      }
    } catch (err) {
      setError("Failed to send magic link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth Sign In
  const handleOAuthSignIn = (provider: "google" | "github") => {
    setError(null);
    setIsLoading(true);
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Planner
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Manage your contexts, tasks, and daily habits
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            className={`flex-1 py-2 px-4 text-center font-medium text-sm border-b-2 transition-colors ${
              activeTab === "signin"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setActiveTab("signin");
              setError(null);
              setMessage(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-4 text-center font-medium text-sm border-b-2 transition-colors ${
              activeTab === "signup"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setActiveTab("signup");
              setError(null);
              setMessage(null);
            }}
          >
            Sign Up
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-4 text-center font-medium text-sm border-b-2 transition-colors ${
              activeTab === "magiclink"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setActiveTab("magiclink");
              setError(null);
              setMessage(null);
            }}
          >
            Magic Link
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700 rounded">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 text-sm text-green-700 rounded">
            {message}
          </div>
        )}

        {/* OAuth Buttons (Shown for Sign In and Sign Up) */}
        {activeTab !== "magiclink" && (
          <div className="space-y-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleOAuthSignIn("google")}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleOAuthSignIn("github")}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
            >
              <svg className="w-5 h-5 fill-current text-gray-900" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              Continue with GitHub
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-xs text-gray-400 font-medium">Or continue with</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
          </div>
        )}

        {/* Tab 1: Sign In Form */}
        {activeTab === "signin" && (
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
            >
              {isLoading ? "Signing in..." : "Sign In with Password"}
            </button>
          </form>
        )}

        {/* Tab 2: Sign Up Form */}
        {activeTab === "signup" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}

        {/* Tab 3: Magic Link Form */}
        {activeTab === "magiclink" && (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
            >
              {isLoading ? "Sending..." : "Send Magic Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
```

---

## 4. Navbar Component (`src/components/Navbar.tsx`)

### Architecture & Design
- **Session Awareness**: Uses `useSession()` to reactively re-render UI based on auth state (`loading`, `unauthenticated`, `authenticated`).
- **Layout Shift Prevention**: Renders skeleton animation placeholder while session state is initializing (`status === "loading"`).
- **Context Switcher Slot**: Explicit container for Milestone 2 Context Switcher UI integration.
- **User Profile Dropdown**:
  - Displays user avatar image (`session.user.image`) or generates initials fallback from user's name/email.
  - Dropdown displays full user name and email.
  - Interactive "Sign Out" button calling `signOut({ callbackUrl: "/login" })`.
  - Click-outside handling via React standard ref + event listener.

### Component Design (`src/components/Navbar.tsx`)

```tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to generate initials for avatar fallback
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return "U";
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition">
              <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg">
                P
              </span>
              Planner
            </Link>

            {/* Placeholder for Context Switcher (Milestone 2 Integration) */}
            <div id="context-switcher-slot" className="hidden sm:flex items-center">
              {/* Context Switcher dropdown will render here in M2 */}
            </div>
          </div>

          {/* Right Navigation & User Actions */}
          <div className="flex items-center space-x-4">
            {/* Loading State Skeleton */}
            {status === "loading" && (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            )}

            {/* Unauthenticated State */}
            {status === "unauthenticated" && (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login?tab=signin"
                  className="px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?tab=signup"
                  className="px-3.5 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Authenticated State */}
            {status === "authenticated" && session?.user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-expanded={dropdownOpen}
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User Avatar"}
                      className="w-8 h-8 rounded-full object-cover border border-gray-300"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center text-xs shadow-sm">
                      {getInitials(session.user.name, session.user.email)}
                    </div>
                  )}
                </button>

                {/* Profile Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-1 border border-gray-100 text-sm text-gray-700 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-900 truncate">
                        {session.user.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {session.user.email}
                      </p>
                    </div>

                    <Link
                      href="/"
                      className="block px-4 py-2 hover:bg-gray-50 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut({ callbackUrl: "/login" });
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition border-t border-gray-100 font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
```

---

## 5. Technical Requirements & Dependencies

1. **Packages**:
   - `next-auth`: `^4.24.0` or `@auth/core` / `next-auth@beta`
   - `react`: `^19.0.0`
   - `next`: `^16.0.0`
   - `tailwindcss`: `^4.0.0`

2. **Routes & API Contracts**:
   - `/api/auth/[...nextauth]`: Handles NextAuth callbacks, credentials sign-in, OAuth sign-in, and magic link generation.
   - `/api/auth/register`: Receives `{ name, email, password }`, hashes password, creates user in Prisma DB, returns user object or error status.

3. **Styling & Layout Alignment**:
   - Compatible with Tailwind CSS v4 class definitions (`flex`, `border`, `rounded-xl`, `shadow-md`, `animate-spin`, `animate-pulse`).
   - Clean color scheme using standard neutral gray tones (`gray-50`, `gray-100`, `gray-700`, `gray-900`) and primary brand blue (`blue-600`, `blue-700`).

---

## 6. Implementation Checklist for Coder Agent

- [ ] Create file `src/components/Providers.tsx` with `"use client"` directive and `<SessionProvider>`.
- [ ] Update `src/app/layout.tsx` to wrap `{children}` inside `<Providers>`.
- [ ] Create `src/app/login/page.tsx` with `<Suspense>` wrapper, tab bar, Credentials/OAuth/Magic Link forms, state management, and error/success notifications.
- [ ] Create `src/components/Navbar.tsx` with `useSession()`, skeleton loader, user initials generator, and interactive profile dropdown menu.
- [ ] Update `src/app/page.tsx` to include `<Navbar />` at top of layout.
