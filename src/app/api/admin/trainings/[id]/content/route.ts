import { NextRequest, NextResponse } from "next/server";
import { pool, isDbConnected } from "@/app/lib/server-db";

interface ContentModule {
  id: string;
  title: string;
  type: "text" | "video" | "document";
  content: string;
}

// GET content modules for a training
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const trainingId = parseInt(id);

    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    const result = await pool.query(
      "SELECT content FROM trainings WHERE id = $1",
      [trainingId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    const content: ContentModule[] = result.rows[0].content || [];
    return NextResponse.json({ success: true, content });
  } catch (error: any) {
    console.error("Get content error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST add or update content modules
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const trainingId = parseInt(id);
    const body = await req.json();
    const { modules } = body;

    if (!modules || !Array.isArray(modules)) {
      return NextResponse.json({ error: "Modules array required" }, { status: 400 });
    }

    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    // Validate each module
    for (const mod of modules) {
      if (!mod.title || !mod.type || !mod.content) {
        return NextResponse.json({ error: "Each module must have title, type, and content" }, { status: 400 });
      }
      if (!["text", "video", "document"].includes(mod.type)) {
        return NextResponse.json({ error: "Module type must be text, video, or document" }, { status: 400 });
      }
    }

    await pool.query(
      "UPDATE trainings SET content = $1, updated_at = NOW() WHERE id = $2",
      [JSON.stringify(modules), trainingId]
    );

    return NextResponse.json({ success: true, content: modules });
  } catch (error: any) {
    console.error("Update content error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE a content module by its id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const trainingId = parseInt(id);
    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get("moduleId");

    if (!moduleId) {
      return NextResponse.json({ error: "moduleId required" }, { status: 400 });
    }

    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    const result = await pool.query(
      "SELECT content FROM trainings WHERE id = $1",
      [trainingId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    const content: ContentModule[] = result.rows[0].content || [];
    const filtered = content.filter((m) => m.id !== moduleId);

    await pool.query(
      "UPDATE trainings SET content = $1, updated_at = NOW() WHERE id = $2",
      [JSON.stringify(filtered), trainingId]
    );

    return NextResponse.json({ success: true, content: filtered });
  } catch (error: any) {
    console.error("Delete content error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
