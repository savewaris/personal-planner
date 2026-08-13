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
    const existing = await (prisma as any).routine.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      return Response.json({ error: "Routine not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.dayKey !== undefined) updateData.dayKey = body.dayKey.toUpperCase().trim();
    if (body.completed !== undefined) updateData.completed = Boolean(body.completed);

    const updated = await (prisma as any).routine.update({
      where: { id },
      data: updateData,
    });

    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: "Failed to update routine" }, { status: 500 });
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
    const existing = await (prisma as any).routine.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      return Response.json({ error: "Routine not found" }, { status: 404 });
    }

    await (prisma as any).routine.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Failed to delete routine" }, { status: 500 });
  }
}
