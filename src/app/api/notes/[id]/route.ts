import { prisma, serverDb } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  serverDb.updateNote(id, body);

  if (!process.env.DATABASE_URL) {
    return Response.json({ id, ...body, updatedAt: new Date().toISOString() });
  }

  try {
    const existing = await (prisma as any).note.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ id, ...body, updatedAt: new Date().toISOString() });
    }

    const updated = await (prisma as any).note.update({
      where: { id },
      data: {
        content: body.content ? body.content.trim() : existing.content,
        contextId: body.contextId !== undefined ? body.contextId : existing.contextId,
      },
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

  serverDb.deleteNote(id);

  if (!process.env.DATABASE_URL) {
    return Response.json({ success: true });
  }

  try {
    const existing = await (prisma as any).note.findUnique({ where: { id } });
    if (existing) {
      await (prisma as any).note.delete({ where: { id } });
    }
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: true });
  }
}
