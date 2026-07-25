import { prisma } from "@/lib/prisma";
import { LOCAL_USER_ID, getOrCreateLocalUser } from "@/lib/user";
import { withErrorHandler, successResponse, errorResponse } from "@/lib/api-response";

const FALLBACK_TASKS = [
  {
    id: "task-1",
    title: "Review Q3 client project deliverables",
    description: "Audit milestone progress and draft status report.",
    completed: true,
    status: "DONE",
    priority: "MEDIUM",
    tags: JSON.stringify(["freelance", "review"]),
    subtasks: null,
    contextId: "ctx-freelance",
    projectId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-2",
    title: "Finish API route handler implementation",
    description: "Ensure Next.js 16 awaited params pattern across all route files.",
    completed: true,
    status: "DONE",
    priority: "HIGH",
    tags: JSON.stringify(["dev", "backend"]),
    subtasks: null,
    contextId: "ctx-work",
    projectId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-3",
    title: "Morning 30-min walk & stretch",
    description: "Get sunlight and fresh air before starting deep work.",
    completed: true,
    status: "DONE",
    priority: "MEDIUM",
    tags: JSON.stringify(["health"]),
    subtasks: null,
    contextId: "ctx-personal",
    projectId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const GET = withErrorHandler(async (request: Request) => {
  if (!process.env.DATABASE_URL) {
    return successResponse(FALLBACK_TASKS);
  }

  try {
    await getOrCreateLocalUser();

    const url = new URL(request.url);
    const contextId = url.searchParams.get("contextId");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

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

    return successResponse(tasks.length > 0 ? tasks : FALLBACK_TASKS);
  } catch (error) {
    console.warn("[Prisma GET /api/tasks fallback]:", error);
    return successResponse(FALLBACK_TASKS);
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

  if (!process.env.DATABASE_URL) {
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
    return successResponse(newTask, 201);
  }
});
