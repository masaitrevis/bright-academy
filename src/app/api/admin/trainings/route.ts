import { NextRequest, NextResponse } from "next/server";
import { pool, dbRowToTraining, isDbConnected } from "@/app/lib/server-db";
import { requireAdmin } from "@/app/lib/admin-auth";

// Create training (admin only)
export async function POST(req: NextRequest) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;
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
export async function GET(req: NextRequest) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;
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

// Update training metadata
export async function PUT(req: NextRequest) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;
  try {
    const body = await req.json();
    const { id, title, code, description, price, duration, level, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Training ID required" }, { status: 400 });
    }

    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
    if (code !== undefined) { fields.push(`code = $${idx++}`); values.push(code); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (price !== undefined) { fields.push(`price = $${idx++}`); values.push(price); }
    if (duration !== undefined) { fields.push(`duration = $${idx++}`); values.push(duration); }
    if (level !== undefined) { fields.push(`level = $${idx++}`); values.push(level); }
    if (status !== undefined) { fields.push(`status = $${idx++}`); values.push(status); }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(id);
    const query = `UPDATE trainings SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${idx} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, training: dbRowToTraining(result.rows[0]) });
  } catch (error: any) {
    console.error("Update training error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete training
export async function DELETE(req: NextRequest) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Training ID required" }, { status: 400 });
    }

    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    await pool.query("DELETE FROM trainings WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete training error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
