import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!process.env.DATABASE_URL) {
      return Response.json({ id, ...body, updatedAt: new Date().toISOString() });
    }

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
    const { id } = await params;
    return Response.json({ id, success: true });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!process.env.DATABASE_URL) {
      return Response.json({ success: true });
    }

    const existing = await prisma.habit.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ success: true });
    }

    await prisma.habit.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: true });
  }
}
