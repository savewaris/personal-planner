/**
 * API Route: /api/tasks/[id]
 * 
 * Handles updating and deleting individual tasks.
 * No authentication — ownership verified via LOCAL_USER_ID.
 * 
 * NEXT.JS 16: params is a Promise and must be awaited.
 */

import { prisma } from "@/lib/prisma";
import { LOCAL_USER_ID } from "@/lib/user";

// ─── PATCH /api/tasks/[id] ──────────────────────────────────────────────────
// Updates task properties (title, description, completed, status, priority, tags, subtasks, contextId, projectId)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      completed,
      status,
      priority,
      tags,
      subtasks,
      contextId,
      projectId,
    } = body;

    // Verify task exists and belongs to local user
    const existing = await prisma.task.findUnique({
      where: { id },
      include: { context: true },
    });

    if (!existing || existing.context.userId !== LOCAL_USER_ID) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return Response.json(
          { error: "Title cannot be empty" },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }

    if (status !== undefined) {
      updateData.status = status;
      updateData.completed = status === "DONE";
    } else if (completed !== undefined) {
      updateData.completed = Boolean(completed);
      updateData.status = completed ? "DONE" : "TODO";
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    if (tags !== undefined) {
      updateData.tags = typeof tags === "object" ? JSON.stringify(tags) : tags;
    }

    if (subtasks !== undefined) {
      updateData.subtasks = typeof subtasks === "object" ? JSON.stringify(subtasks) : subtasks;
    }

    if (contextId !== undefined) {
      const context = await prisma.context.findUnique({ where: { id: contextId } });
      if (!context || context.userId !== LOCAL_USER_ID) {
        return Response.json({ error: "Invalid context ID" }, { status: 400 });
      }
      updateData.contextId = contextId;
    }

    if (projectId !== undefined) {
      if (projectId === null) {
        updateData.projectId = null;
      } else {
        const targetContextId = contextId || existing.contextId;
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project || project.contextId !== targetContextId) {
          return Response.json({ error: "Invalid project ID" }, { status: 400 });
        }
        updateData.projectId = projectId;
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        context: true,
        project: true,
      },
    });

    return Response.json(updatedTask);
  } catch (error) {
    console.error("[PATCH /api/tasks/[id]] Error:", error);
    return Response.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/tasks/[id] ─────────────────────────────────────────────────
// Deletes a task
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify task exists and belongs to local user
    const existing = await prisma.task.findUnique({
      where: { id },
      include: { context: true },
    });

    if (!existing || existing.context.userId !== LOCAL_USER_ID) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/tasks/[id]] Error:", error);
    return Response.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
