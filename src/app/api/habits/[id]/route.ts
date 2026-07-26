import { prisma } from "@/lib/prisma";
import { serverDb } from "@/lib/db-store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  serverDb.updateHabit(id, body);

  if (!process.env.DATABASE_URL) {
    return Response.json({ id, ...body, updatedAt: new Date().toISOString() });
  }

  try {
    const existing = await prisma.habit.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ id, ...body, updatedAt: new Date().toISOString() });
    }

    const updated = await prisma.habit.update({
      where: { id },
      data: { name: body.name ? body.name.trim() : existing.name },
      include: { logs: true },
    });

    return Response.json(updated);
  } catch (error) {
    return Response.json({ id, success: true });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  serverDb.deleteHabit(id);

  if (!process.env.DATABASE_URL) {
    return Response.json({ success: true });
  }

  try {
    const existing = await prisma.habit.findUnique({ where: { id } });
    if (existing) {
      await prisma.habit.delete({ where: { id } });
    }
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: true });
  }
}
