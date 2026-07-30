import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId, seedUserDefaults } from "@/lib/user";
import { withErrorHandler, successResponse, errorResponse } from "@/lib/api-response";
import { serverDb } from "@/lib/db-store";

export const GET = withErrorHandler(async (request: Request) => {
  const userId = await getAuthenticatedUserId();
  if (!userId) return errorResponse("Unauthorized", 401);

  const url = new URL(request.url);
  const contextId = url.searchParams.get("contextId") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const search = url.searchParams.get("search") || undefined;

  try {
    // Ensure user has default data on first request
    await seedUserDefaults(userId);

    const where: any = {
      context: {
        userId,
      },
    };

    if (contextId) where.contextId = contextId;
    if (status) where.status = status;
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim() } },
        { description: { contains: search.trim() } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        context: true,
        project: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(tasks);
  } catch (error) {
    console.warn("[GET /api/tasks] Error:", error);
    return successResponse(serverDb.getTasks(contextId, status, search));
  }
});

export const POST = withErrorHandler(async (request: Request) => {
  const userId = await getAuthenticatedUserId();
  if (!userId) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  const {
    title,
    description,
    contextId,
    projectId,
    status = "TODO",
    priority = "MEDIUM",
    tags,
    subtasks,
  } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return errorResponse("Task title is required", 400);
  }

  const tagsString = typeof tags === "object" ? JSON.stringify(tags) : tags;
  const subtasksString = typeof subtasks === "object" ? JSON.stringify(subtasks) : subtasks;

  try {
    // Ensure user has default contexts before creating a task
    await seedUserDefaults(userId);

    // If no contextId provided, use user's first context
    let resolvedContextId = contextId;
    if (!resolvedContextId) {
      const firstContext = await prisma.context.findFirst({ where: { userId } });
      resolvedContextId = firstContext?.id;
    }

    if (!resolvedContextId) {
      return errorResponse("No context available. Please create a workspace context first.", 400);
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        completed: status === "DONE",
        status: status || "TODO",
        priority: priority || "MEDIUM",
        tags: tagsString || null,
        subtasks: subtasksString || null,
        contextId: resolvedContextId,
        projectId: projectId || null,
      },
      include: {
        context: true,
        project: true,
      },
    });
    return successResponse(task, 201);
  } catch (error) {
    console.warn("[POST /api/tasks] Error:", error);
    return errorResponse("Failed to create task", 500);
  }
});
