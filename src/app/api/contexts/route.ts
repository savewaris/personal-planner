import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId, seedUserDefaults } from "@/lib/user";
import { withErrorHandler, successResponse, errorResponse } from "@/lib/api-response";

export const GET = withErrorHandler(async () => {
  const userId = await getAuthenticatedUserId();
  if (!userId) return errorResponse("Unauthorized", 401);

  try {
    // Ensure user has default contexts on first request
    await seedUserDefaults(userId);

    const contexts = await prisma.context.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    return successResponse(contexts);
  } catch (error) {
    console.warn("[GET /api/contexts] Error:", error);
    return errorResponse("Failed to load contexts", 500);
  }
});

export const POST = withErrorHandler(async (request: Request) => {
  const userId = await getAuthenticatedUserId();
  if (!userId) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  const { name, color } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return errorResponse("Context name is required", 400);
  }

  try {
    const context = await prisma.context.create({
      data: {
        name: name.trim(),
        color: color || "blue",
        userId,
      },
    });
    return successResponse(context, 201);
  } catch (error) {
    return errorResponse("Failed to create context", 500);
  }
});
