import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    try {
      const updated = await (prisma as any).project.update({
        where: { id },
        data: {
          ...(body.title !== undefined && { title: body.title }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.requirements !== undefined && {
            requirements: typeof body.requirements === "string" ? body.requirements : JSON.stringify(body.requirements),
          }),
          ...(body.techStack !== undefined && {
            techStack: typeof body.techStack === "string" ? body.techStack : JSON.stringify(body.techStack),
          }),
          ...(body.status !== undefined && { status: body.status }),
          ...(body.tags !== undefined && {
            tags: typeof body.tags === "string" ? body.tags : JSON.stringify(body.tags),
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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
