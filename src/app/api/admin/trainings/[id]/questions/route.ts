import { NextRequest, NextResponse } from "next/server";
import { pool, dbRowToQuestion, isDbConnected } from "@/app/lib/server-db";

// GET questions for a training
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const trainingId = parseInt(id);

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

// POST add a question to a training
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const trainingId = parseInt(id);
    const body = await req.json();
    const { question, options, correctAnswer, explanation } = body;

    if (!question || !options || !Array.isArray(options) || correctAnswer === undefined) {
      return NextResponse.json({ error: "Question, options array, and correctAnswer required" }, { status: 400 });
    }

    if (options.length !== 4) {
      return NextResponse.json({ error: "Exactly 4 options required" }, { status: 400 });
    }

    if (correctAnswer < 0 || correctAnswer > 3) {
      return NextResponse.json({ error: "correctAnswer must be 0-3 (index of correct option)" }, { status: 400 });
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

// DELETE a question
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const trainingId = parseInt(id);
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return NextResponse.json({ error: "questionId required" }, { status: 400 });
    }

    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    await pool.query(
      "DELETE FROM questions WHERE id = $1 AND training_id = $2",
      [questionId, trainingId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete question error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
