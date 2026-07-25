import { prisma } from "@/lib/prisma";
import { LOCAL_USER_ID, getOrCreateLocalUser } from "@/lib/user";
import { withErrorHandler, successResponse, errorResponse } from "@/lib/api-response";

const FALLBACK_CONTEXTS = [
  { id: "ctx-personal", name: "Personal", color: "blue", userId: LOCAL_USER_ID, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "ctx-work", name: "Work", color: "emerald", userId: LOCAL_USER_ID, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "ctx-freelance", name: "Freelance", color: "purple", userId: LOCAL_USER_ID, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const GET = withErrorHandler(async () => {
  if (!process.env.DATABASE_URL) {
    return successResponse(FALLBACK_CONTEXTS);
  }

  try {
    await getOrCreateLocalUser();
    const contexts = await prisma.context.findMany({
      where: { userId: LOCAL_USER_ID },
      orderBy: { createdAt: "asc" },
    });
    return successResponse(contexts.length > 0 ? contexts : FALLBACK_CONTEXTS);
  } catch (error) {
    console.warn("[Prisma GET /api/contexts fallback]:", error);
    return successResponse(FALLBACK_CONTEXTS);
  }
});

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();
  const { name, color } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return errorResponse("Context name is required", 400);
  }

  if (!process.env.DATABASE_URL) {
    const newContext = {
      id: `ctx-${Date.now()}`,
      name: name.trim(),
      color: color || "blue",
      userId: LOCAL_USER_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return successResponse(newContext, 201);
  }

  try {
    await getOrCreateLocalUser();
    const context = await prisma.context.create({
      data: {
        name: name.trim(),
        color: color || "blue",
        userId: LOCAL_USER_ID,
      },
    });
    return successResponse(context, 201);
  } catch (error) {
    const fallbackContext = {
      id: `ctx-${Date.now()}`,
      name: name.trim(),
      color: color || "blue",
      userId: LOCAL_USER_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return successResponse(fallbackContext, 201);
  }
});
