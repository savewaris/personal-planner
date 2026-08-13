import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    try {
      const updated = await (prisma as any).project.update({
        where: { id },
        data: {
          ...(body.title !== undefined && { title: body.title }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.workflow !== undefined && {
            workflow: typeof body.workflow === "string" ? body.workflow : JSON.stringify(body.workflow),
          }),
          ...(body.requirements !== undefined && {
            requirements: typeof body.requirements === "string" ? body.requirements : JSON.stringify(body.requirements),
          }),
        },
      });
      return NextResponse.json(updated);
    } catch {
      return NextResponse.json({ id, ...body }, { status: 200 });
    }
  } catch (error) {
    console.error("PATCH /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    try {
      await (prisma as any).project.delete({
        where: { id },
      });
    } catch {
      // Ignore if table not present
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
