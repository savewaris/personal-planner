/**
 * API Route: /api/contexts/[id]
 * 
 * Handles updating and deleting individual contexts.
 * No authentication — ownership verified via LOCAL_USER_ID.
 * 
 * NEXT.JS 16: params is a Promise and must be awaited.
 */

import { prisma } from "@/lib/prisma";
import { LOCAL_USER_ID } from "@/lib/user";

// ─── PATCH /api/contexts/[id] ───────────────────────────────────────────────
// Updates a context's name and/or color
// Body: { name?: string, color?: string }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, color } = body;

    // Verify the context exists and belongs to the local user
    const existing = await prisma.context.findUnique({ where: { id } });

    if (!existing || existing.userId !== LOCAL_USER_ID) {
      return Response.json({ error: "Context not found" }, { status: 404 });
    }

    // Build update data — only include fields that were provided
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
// Deletes a context and all its cascading tasks/projects
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify the context exists and belongs to the local user
    const existing = await prisma.context.findUnique({ where: { id } });

    if (!existing || existing.userId !== LOCAL_USER_ID) {
      return Response.json({ error: "Context not found" }, { status: 404 });
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
