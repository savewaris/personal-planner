/**
 * API Route: /api/contexts/[id]
 * 
 * Handles updating and deleting individual contexts.
 * Uses getAuthenticatedUserId() for robust session/auth user matching.
 * 
 * NEXT.JS 16: params is a Promise and must be awaited.
 */

import { prisma } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/auth";

// ─── PATCH /api/contexts/[id] ───────────────────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, color } = body;

    // Verify the context exists and belongs to the authenticated user
    const existing = await prisma.context.findUnique({ where: { id } });

    if (!existing || existing.userId !== userId) {
      return Response.json({ error: "Context not found" }, { status: 404 });
    }

    const updateData: { name?: string; color?: string } = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return Response.json(
          { error: "Context name cannot be empty" },
          { status: 400 }
        );
      }
      if (name.trim().length > 50) {
        return Response.json(
          { error: "Context name must be 50 characters or less" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }
    if (color !== undefined) {
      updateData.color = color;
    }

    const updated = await prisma.context.update({
      where: { id },
      data: updateData,
    });

    return Response.json(updated);
  } catch (error) {
    console.error("[PATCH /api/contexts/[id]] Error:", error);
    return Response.json(
      { error: "Failed to update context" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/contexts/[id] ──────────────────────────────────────────────
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the context exists and belongs to the authenticated user
    const existing = await prisma.context.findUnique({ where: { id } });

    if (!existing || existing.userId !== userId) {
      return Response.json({ error: "Context not found" }, { status: 404 });
    }

    // Reassign tasks to remaining fallback context if present to avoid cascade loss
    const remainingContext = await prisma.context.findFirst({
      where: { userId, id: { not: id } },
    });

    if (remainingContext) {
      await prisma.task.updateMany({
        where: { contextId: id },
        data: { contextId: remainingContext.id },
      });
    }

    await prisma.context.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/contexts/[id]] Error:", error);
    return Response.json(
      { error: "Failed to delete context" },
      { status: 500 }
    );
  }
}
