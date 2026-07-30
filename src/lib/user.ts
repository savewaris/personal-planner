/**
 * User Helper — Local / Single-User Mode
 *
 * Provides central helpers for local database storage and user defaults.
 */

import { prisma } from "@/lib/prisma";

export const LOCAL_USER_ID = "local";
export const LOCAL_USER_EMAIL = "local@personal.mode";
export const LOCAL_USER_NAME = "Personal User";

// In-memory cache to prevent redundant DB seed checks on every HTTP request
const seededUsersSet = new Set<string>();

/**
 * Returns the active user's ID ("local").
 */
export async function getAuthenticatedUserId(): Promise<string> {
  return LOCAL_USER_ID;
}

const DEFAULT_CONTEXT_TEMPLATES = [
  { name: "Personal", color: "blue" },
  { name: "Work", color: "emerald" },
  { name: "Freelance", color: "purple" },
];

/**
 * Ensures the local user record and default contexts exist in Neon DB.
 * Clean slate mode: 0 sample tasks, 0 sample habits injected.
 */
export async function seedUserDefaults(userId: string = LOCAL_USER_ID) {
  if (seededUsersSet.has(userId)) return;

  try {
    // 1. Ensure User record exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: LOCAL_USER_NAME,
        email: LOCAL_USER_EMAIL,
      },
    });

    // 2. Check if user already has contexts
    const existingContextCount = await prisma.context.count({
      where: { userId },
    });

    if (existingContextCount > 0) {
      seededUsersSet.add(userId);
      return;
    }

    // 3. Seed default context categories
    await Promise.all(
      DEFAULT_CONTEXT_TEMPLATES.map((ctx) =>
        prisma.context.create({
          data: {
            name: ctx.name,
            color: ctx.color,
            userId,
          },
        })
      )
    );

    seededUsersSet.add(userId);
  } catch (error) {
    console.warn("[seedUserDefaults] Warning:", error);
  }
}

export async function getOrCreateLocalUser() {
  await seedUserDefaults(LOCAL_USER_ID);
  return {
    id: LOCAL_USER_ID,
    email: LOCAL_USER_EMAIL,
    name: LOCAL_USER_NAME,
  };
}
