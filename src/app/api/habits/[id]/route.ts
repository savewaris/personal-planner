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
    const existing = await prisma.habit.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return Response.json({ error: "Habit not found" }, { status: 404 });
    }

    const updated = await prisma.habit.update({
      where: { id },
      data: { name: body.name ? body.name.trim() : existing.name },
      include: { logs: true },
    });

    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: "Failed to update habit" }, { status: 500 });
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
    const existing = await prisma.habit.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return Response.json({ error: "Habit not found" }, { status: 404 });
    }

    await prisma.habit.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Failed to delete habit" }, { status: 500 });
  }
}
