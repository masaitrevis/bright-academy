import { NextRequest, NextResponse } from "next/server";
import { pool, dbRowToQuestion, isDbConnected } from "@/app/lib/server-db";
import { requireAdmin } from "@/app/lib/admin-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const trainingId = parseInt(id);
    const body = await req.json();
    const { questions } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "questions array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate each question
    const errors: string[] = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question || typeof q.question !== "string") {
        errors.push(`Question ${i + 1}: missing or invalid question text`);
      }
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        errors.push(`Question ${i + 1}: must have exactly 4 options`);
      }
      if (q.correctAnswer === undefined || q.correctAnswer < 0 || q.correctAnswer > 3) {
        errors.push(`Question ${i + 1}: correctAnswer must be 0-3`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
    }

    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const insertedQuestions: any[] = [];
      for (const q of questions) {
        const result = await client.query(
          `INSERT INTO questions (training_id, question, options, correct_answer, explanation)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [trainingId, q.question, JSON.stringify(q.options), q.correctAnswer, q.explanation || ""]
        );
        insertedQuestions.push(dbRowToQuestion(result.rows[0]));
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        count: insertedQuestions.length,
        questions: insertedQuestions,
      });
    } catch (error: any) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Bulk import questions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
