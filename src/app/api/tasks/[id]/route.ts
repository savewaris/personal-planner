import { prisma } from "@/lib/prisma";
import { LOCAL_USER_ID } from "@/lib/user";

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

    const existing = await prisma.task.findUnique({
      where: { id },
      include: { context: true },
    });

    if (!existing || existing.context.userId !== LOCAL_USER_ID) {
      return Response.json({ id, ...body, updatedAt: new Date().toISOString() });
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
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    return Response.json({ id, ...body, success: true });
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

    const existing = await prisma.task.findUnique({
      where: { id },
      include: { context: true },
    });

    if (!existing) {
      return Response.json({ success: true });
    }

    await prisma.task.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: true });
  }
}
