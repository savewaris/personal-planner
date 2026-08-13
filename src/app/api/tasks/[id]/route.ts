import { prisma } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const existing = await prisma.task.findUnique({
      where: { id },
      include: { context: true },
    });

    // Verify ownership: task's context must belong to the authenticated user
    if (!existing || existing.context.userId !== userId) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description ? body.description.trim() : null;
    if (body.status !== undefined) {
      updateData.status = body.status;
      updateData.completed = body.status === "DONE";
    } else if (body.completed !== undefined) {
      updateData.completed = Boolean(body.completed);
      updateData.status = body.completed ? "DONE" : "TODO";
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: { context: true, project: true },
    });

    return Response.json(updatedTask);
  } catch (error) {
    return Response.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await prisma.task.findUnique({
      where: { id },
      include: { context: true },
    });

    // Verify ownership before deletion
    if (!existing || existing.context.userId !== userId) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
