/**
 * API Route: /api/habits/[id]
 * 
 * Handles updating and deleting individual habits.
 * No authentication — ownership verified via LOCAL_USER_ID.
 * 
 * NEXT.JS 16: params is a Promise and must be awaited.
 */

import { prisma } from "@/lib/prisma";
import { LOCAL_USER_ID } from "@/lib/user";

// ─── PATCH /api/habits/[id] ─────────────────────────────────────────────────
// Updates habit name
// Body: { name: string }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    const existing = await prisma.habit.findUnique({ where: { id } });

    if (!existing || existing.userId !== LOCAL_USER_ID) {
      return Response.json({ error: "Habit not found" }, { status: 404 });
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json(
        { error: "Habit name cannot be empty" },
        { status: 400 }
      );
    }

    const updated = await prisma.habit.update({
      where: { id },
      data: { name: name.trim() },
      include: { logs: true },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("[PATCH /api/habits/[id]] Error:", error);
    return Response.json(
      { error: "Failed to update habit" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/habits/[id] ────────────────────────────────────────────────
// Deletes a habit and all its completion logs
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.habit.findUnique({ where: { id } });

    if (!existing || existing.userId !== LOCAL_USER_ID) {
      return Response.json({ error: "Habit not found" }, { status: 404 });
    }

    await prisma.habit.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/habits/[id]] Error:", error);
    return Response.json(
      { error: "Failed to delete habit" },
      { status: 500 }
    );
  }
}
