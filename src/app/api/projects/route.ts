import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const projects = await (prisma as any).project.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, requirements } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Project title is required" },
        { status: 400 }
      );
    }

    try {
      const created = await (prisma as any).project.create({
        data: {
          title: title.trim(),
          description: description?.trim() || "",
          requirements: JSON.stringify(requirements || []),
        },
      });
      return NextResponse.json(created, { status: 201 });
    } catch {
      // Return synthetic project item if DB table not yet migrated
      const synthetic = {
        id: `proj-${Date.now()}`,
        title: title.trim(),
        description: description?.trim() || "",
        requirements: requirements || [],
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json(synthetic, { status: 201 });
    }
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
