import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId, seedUserDefaults } from "@/lib/user";
import { withErrorHandler, successResponse, errorResponse } from "@/lib/api-response";

export const GET = withErrorHandler(async (request: Request) => {
  const userId = await getAuthenticatedUserId();
  if (!userId) return errorResponse("Unauthorized", 401);

  const url = new URL(request.url);
  const dayKey = url.searchParams.get("dayKey") || undefined;

  try {
    await seedUserDefaults(userId);

    const where: any = { userId };
    if (dayKey) where.dayKey = dayKey.toUpperCase().trim();

    const routines = await (prisma as any).routine.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return successResponse(routines);
  } catch (error) {
    console.warn("[GET /api/routines] Error:", error);
    return successResponse([]);
  }
});

export const POST = withErrorHandler(async (request: Request) => {
  const userId = await getAuthenticatedUserId();
  if (!userId) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  const { title, dayKey = "MON", tags } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return errorResponse("Routine title is required", 400);
  }

  const tagsString = typeof tags === "object" ? JSON.stringify(tags) : tags;

  try {
    await seedUserDefaults(userId);

    const routine = await (prisma as any).routine.create({
      data: {
        title: title.trim(),
        dayKey: dayKey.toUpperCase().trim(),
        completed: false,
        tags: tagsString || null,
        userId,
      },
    });

    return successResponse(routine, 201);
  } catch (error) {
    console.warn("[POST /api/routines] Error:", error);
    return errorResponse("Failed to create routine", 500);
  }
});
