import { NextRequest, NextResponse } from "next/server";
import { pool, dbRowToQuestion, isDbConnected } from "@/app/lib/server-db";

// Add question to training
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trainingId, question, options, correctAnswer, explanation } = body;

    if (!trainingId || !question || !options || correctAnswer === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    const result = await pool.query(
      `INSERT INTO questions (training_id, question, options, correct_answer, explanation)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [trainingId, question, JSON.stringify(options), correctAnswer, explanation || ""]
    );

    return NextResponse.json({ success: true, question: dbRowToQuestion(result.rows[0]) });
  } catch (error: any) {
    console.error("Create question error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get questions for a training
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const trainingId = searchParams.get("trainingId");

    if (!trainingId) {
      return NextResponse.json({ error: "trainingId required" }, { status: 400 });
    }

    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    const result = await pool.query(
      "SELECT * FROM questions WHERE training_id = $1 ORDER BY id",
      [trainingId]
    );

    return NextResponse.json({ success: true, questions: result.rows.map(dbRowToQuestion) });
  } catch (error: any) {
    console.error("Get questions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
