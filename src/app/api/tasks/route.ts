/**
 * API Route: /api/tasks
 * 
 * Handles listing and creating tasks for the local user.
 * Wrapped in withErrorHandler for standardized JSON error handling.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { LOCAL_USER_ID, getOrCreateLocalUser } from "@/lib/user";
import { withErrorHandler, successResponse, errorResponse } from "@/lib/api-response";

// ─── GET /api/tasks ─────────────────────────────────────────────────────────
export const GET = withErrorHandler(async (request: Request) => {
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

  return successResponse(tasks);
});

// ─── POST /api/tasks ────────────────────────────────────────────────────────
export const POST = withErrorHandler(async (request: Request) => {
  await getOrCreateLocalUser();

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

  if (!contextId || typeof contextId !== "string") {
    return errorResponse("Context ID is required", 400);
  }

  const context = await prisma.context.findUnique({
    where: { id: contextId },
  });

  if (!context || context.userId !== LOCAL_USER_ID) {
    return errorResponse("Invalid context ID", 400);
  }

  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project || project.contextId !== contextId) {
      return errorResponse("Invalid project ID for this context", 400);
    }
  }

  const tagsString = typeof tags === "object" ? JSON.stringify(tags) : tags;
  const subtasksString = typeof subtasks === "object" ? JSON.stringify(subtasks) : subtasks;

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description ? description.trim() : null,
      completed: status === "DONE",
      status: status || "TODO",
      priority: priority || "MEDIUM",
      tags: tagsString || null,
      subtasks: subtasksString || null,
      contextId,
      projectId: projectId || null,
    },
    include: {
      context: true,
      project: true,
    },
  });

  return successResponse(task, 201);
});
