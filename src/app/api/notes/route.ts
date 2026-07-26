import { prisma } from "@/lib/prisma";
import { LOCAL_USER_ID, getOrCreateLocalUser } from "@/lib/user";
import { withErrorHandler, successResponse, errorResponse } from "@/lib/api-response";
import { serverDb } from "@/lib/db-store";

export const GET = withErrorHandler(async () => {
  if (!process.env.DATABASE_URL) {
    return successResponse(serverDb.getNotes());
  }

  try {
    await getOrCreateLocalUser();
    const notes = await (prisma as any).note.findMany({
      where: { userId: LOCAL_USER_ID },
      orderBy: { createdAt: "desc" },
    });
    return successResponse(notes);
  } catch (error) {
    console.warn("[Prisma GET /api/notes fallback]:", error);
    return successResponse(serverDb.getNotes());
  }
});

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();
  const { content, contextId } = body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return errorResponse("Note content is required", 400);
  }

  const newNote = {
    id: `note-${Date.now()}`,
    content: content.trim(),
    contextId: contextId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  serverDb.addNote(newNote);

  if (!process.env.DATABASE_URL) {
    return successResponse(newNote, 201);
  }

  try {
    await getOrCreateLocalUser();
    const note = await (prisma as any).note.create({
      data: {
        content: content.trim(),
        contextId: contextId || null,
        userId: LOCAL_USER_ID,
      },
    });
    return successResponse(note, 201);
  } catch (error) {
    return successResponse(newNote, 201);
  }
});
