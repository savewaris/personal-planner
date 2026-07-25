/**
 * API Route: /api/contexts
 * 
 * Handles listing and creating workspace contexts for the local user.
 * Wrapped in withErrorHandler for standardized JSON error handling.
 */

import { prisma } from "@/lib/prisma";
import { LOCAL_USER_ID, getOrCreateLocalUser } from "@/lib/user";
import { withErrorHandler, successResponse, errorResponse } from "@/lib/api-response";

// ─── GET /api/contexts ──────────────────────────────────────────────────────
export const GET = withErrorHandler(async () => {
  await getOrCreateLocalUser();

  const contexts = await prisma.context.findMany({
    where: { userId: LOCAL_USER_ID },
    orderBy: { createdAt: "asc" },
  });

  return successResponse(contexts);
});

// ─── POST /api/contexts ─────────────────────────────────────────────────────
export const POST = withErrorHandler(async (request: Request) => {
  await getOrCreateLocalUser();

  const body = await request.json();
  const { name, color } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return errorResponse("Context name is required", 400);
  }

  if (name.trim().length > 50) {
    return errorResponse("Context name must be 50 characters or less", 400);
  }

  const context = await prisma.context.create({
    data: {
      name: name.trim(),
      color: color || "blue",
      userId: LOCAL_USER_ID,
    },
  });

  return successResponse(context, 201);
});
