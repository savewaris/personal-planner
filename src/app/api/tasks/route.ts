import { prisma } from "@/lib/prisma";
import { LOCAL_USER_ID, getOrCreateLocalUser } from "@/lib/user";
import { withErrorHandler, successResponse, errorResponse } from "@/lib/api-response";
import { serverDb } from "@/lib/db-store";

export const GET = withErrorHandler(async (request: Request) => {
  const url = new URL(request.url);
  const contextId = url.searchParams.get("contextId") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const search = url.searchParams.get("search") || undefined;

  if (!process.env.DATABASE_URL) {
    return successResponse(serverDb.getTasks(contextId, status, search));
  }

  try {
    await getOrCreateLocalUser();

    const where: any = {
      context: {
        userId: LOCAL_USER_ID,
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
    console.warn("[Prisma GET /api/tasks fallback]:", error);
    return successResponse(serverDb.getTasks(contextId, status, search));
  }
});

export const POST = withErrorHandler(async (request: Request) => {
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

  const newTask = {
    id: `task-${Date.now()}`,
    title: title.trim(),
    description: description ? description.trim() : null,
    completed: status === "DONE",
    status: status || "TODO",
    priority: priority || "MEDIUM",
    tags: tagsString || null,
    subtasks: subtasksString || null,
    contextId: contextId || "ctx-personal",
    projectId: projectId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  serverDb.addTask(newTask);

  if (!process.env.DATABASE_URL) {
    return successResponse(newTask, 201);
  }

  try {
    await getOrCreateLocalUser();
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        completed: status === "DONE",
        status: status || "TODO",
        priority: priority || "MEDIUM",
        tags: tagsString || null,
        subtasks: subtasksString || null,
        contextId: contextId || "ctx-personal",
        projectId: projectId || null,
      },
      include: {
        context: true,
        project: true,
      },
    });
    return successResponse(task, 201);
  } catch (error) {
    return successResponse(newTask, 201);
  }
});
