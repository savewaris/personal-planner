/**
 * Local User Helper — Personal Mode
 *
 * This module eliminates all authentication barriers by providing a single,
 * deterministic local user identity. Every API route and data operation
 * references this constant instead of extracting userId from a session.
 *
 * The `getOrCreateLocalUser()` function ensures the local user and a default
 * "Personal" context always exist in the database, auto-seeding on first run.
 */

import { prisma } from "@/lib/prisma";

// ─── Constants ──────────────────────────────────────────────────────────────
/** The fixed user ID for single-user Personal Mode */
export const LOCAL_USER_ID = "local";

/** The email associated with the local user (not used for auth, just a DB field) */
export const LOCAL_USER_EMAIL = "local@personal.mode";

/** Default user display name */
export const LOCAL_USER_NAME = "Personal User";

// ─── User Bootstrap ─────────────────────────────────────────────────────────
/**
 * Ensures the local user record and a default "Personal" context exist.
 * Uses Prisma upsert to be idempotent — safe to call on every request.
 *
 * @returns The local User record with its contexts included
 */
export async function getOrCreateLocalUser() {
  // Upsert the local user — creates on first run, no-ops afterwards
  const user = await prisma.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: {},
    create: {
      id: LOCAL_USER_ID,
      email: LOCAL_USER_EMAIL,
      name: LOCAL_USER_NAME,
    },
    include: {
      contexts: true,
    },
  });

  // If the user has no contexts yet, seed a default "Personal" context
  if (user.contexts.length === 0) {
    await prisma.context.create({
      data: {
        name: "Personal",
        color: "blue",
        userId: LOCAL_USER_ID,
      },
    });
  }

  return user;
}
