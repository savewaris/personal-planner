import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/user";
import { withErrorHandler, successResponse, errorResponse } from "@/lib/api-response";

export const GET = withErrorHandler(async () => {
  const userId = await getAuthenticatedUserId();
  if (!userId) return errorResponse("Unauthorized", 401);

  try {
    const notes = await (prisma as any).note.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return successResponse(notes);
  } catch (error) {
    console.warn("[GET /api/notes] Error:", error);
    return successResponse([]);
  }
});

export const POST = withErrorHandler(async (request: Request) => {
  const userId = await getAuthenticatedUserId();
  if (!userId) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  const { content, contextId } = body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return errorResponse("Note content is required", 400);
  }

  try {
    const note = await (prisma as any).note.create({
      data: {
        content: content.trim(),
        contextId: contextId || null,
        userId,
      },
    });
    return successResponse(note, 201);
  } catch (error) {
    return errorResponse("Failed to create note", 500);
  }
});
