import { NextRequest, NextResponse } from "next/server";
import { pool, isDbConnected } from "@/app/lib/server-db";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "bright-academy-jwt-secret-2024"
);

export async function GET(req: NextRequest) {
  try {
    // Verify user token (from header or query param for browser navigation)
    const authHeader = req.headers.get("authorization");
    const queryToken = searchParams.get("token");
    let userId: string | null = null;

    const tokenToVerify = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : queryToken;

    if (tokenToVerify) {
      try {
        const { payload } = await jwtVerify(tokenToVerify, JWT_SECRET, { clockTolerance: 60 });
        userId = (payload as any).id || (payload as any).userId || null;
      } catch {
        // Invalid token
      }
    }

    const { searchParams } = new URL(req.url);
    const trainingId = searchParams.get("trainingId");
    const moduleId = searchParams.get("moduleId");

    if (!trainingId || !moduleId) {
      return NextResponse.json({ error: "trainingId and moduleId required" }, { status: 400 });
    }

    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    // Check enrollment if user is logged in
    if (userId) {
      const enrollRes = await pool.query(
        "SELECT paid FROM enrollments WHERE user_id = $1 AND training_id = $2",
        [userId, parseInt(trainingId)]
      );
      // Allow viewing if enrolled and paid (or training is free — checked below)
    }

    // Get the training content
    const result = await pool.query(
      "SELECT content, is_free FROM trainings WHERE id = $1",
      [parseInt(trainingId)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    const training = result.rows[0];
    const content = training.content || [];
    const module = content.find((m: any) => m.id === moduleId);

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Check if user has access
    const isFree = training.is_free;
    if (!isFree && userId) {
      const enrollRes = await pool.query(
        "SELECT paid FROM enrollments WHERE user_id = $1 AND training_id = $2",
        [userId, parseInt(trainingId)]
      );
      if (enrollRes.rows.length === 0 || !enrollRes.rows[0].paid) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Extract base64 data from data URL
    const fileUrl = module.fileUrl || module.content;
    if (!fileUrl || !fileUrl.startsWith("data:")) {
      return NextResponse.json({ error: "Invalid file data" }, { status: 400 });
    }

    const match = fileUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Invalid data URL format" }, { status: 400 });
    }

    const mimeType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, "base64");

    // Map MIME types to file extensions for Content-Disposition
    const extMap: Record<string, string> = {
      "application/pdf": "pdf",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
      "application/vnd.ms-powerpoint": "ppt",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
      "application/msword": "doc",
    };
    const ext = extMap[mimeType] || "bin";
    const fileName = module.fileName || `document.${ext}`;

    // Serve inline (not as attachment) — browser will try to render or use built-in viewer
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("View file error:", error);
    return NextResponse.json({ error: error.message || "Failed to serve file" }, { status: 500 });
  }
}
