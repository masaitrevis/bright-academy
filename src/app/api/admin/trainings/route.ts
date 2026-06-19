import { NextRequest, NextResponse } from "next/server";
import { pool, dbRowToTraining, isDbConnected } from "@/app/lib/server-db";

// Create training (admin only)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, code, description, price, duration, level, content } = body;

    if (!title || !code) {
      return NextResponse.json({ error: "Title and code required" }, { status: 400 });
    }

    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    const result = await pool.query(
      `INSERT INTO trainings (title, code, description, price, duration, level, content)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, code, description || "", price || 0, duration || "", level || "", JSON.stringify(content || [])]
    );

    return NextResponse.json({ success: true, training: dbRowToTraining(result.rows[0]) });
  } catch (error: any) {
    console.error("Create training error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get all trainings (admin)
export async function GET() {
  try {
    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    const result = await pool.query("SELECT * FROM trainings ORDER BY created_at DESC");
    return NextResponse.json({ success: true, trainings: result.rows.map(dbRowToTraining) });
  } catch (error: any) {
    console.error("Get trainings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
