import { NextRequest, NextResponse } from "next/server";
import { pool, isDbConnected } from "@/app/lib/server-db";

// Get 15 random questions for a training
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const trainingId = parseInt(id);

    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    const result = await pool.query(
      `SELECT id, question, options FROM questions 
       WHERE training_id = $1 
       ORDER BY RANDOM() 
       LIMIT 15`,
      [trainingId]
    );

    return NextResponse.json({ success: true, questions: result.rows });
  } catch (error: any) {
    console.error("Exam questions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Submit exam answers
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const trainingId = parseInt(id);
    const body = await req.json();
    const { driverId, answers } = body;

    if (!driverId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    // Get enrollment
    const enrollmentResult = await pool.query(
      "SELECT * FROM enrollments WHERE driver_id = $1 AND training_id = $2",
      [driverId, trainingId]
    );

    if (enrollmentResult.rows.length === 0) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }

    const enrollment = enrollmentResult.rows[0];

    if (!enrollment.paid) {
      return NextResponse.json({ error: "Payment required" }, { status: 403 });
    }

    if (enrollment.exam_attempts >= enrollment.max_attempts) {
      return NextResponse.json({ error: "Maximum attempts reached" }, { status: 403 });
    }

    if (enrollment.passed) {
      return NextResponse.json({ error: "Already passed" }, { status: 403 });
    }

    // Get correct answers
    const questionIds = answers.map((a: any) => a.questionId);
    const questionsResult = await pool.query(
      "SELECT id, correct_answer FROM questions WHERE id = ANY($1)",
      [questionIds]
    );

    const correctMap = new Map(questionsResult.rows.map((q) => [q.id, q.correct_answer]));

    let score = 0;
    for (const answer of answers) {
      if (correctMap.get(answer.questionId) === answer.selectedAnswer) {
        score++;
      }
    }

    const passed = score >= 10; // Pass if 10/15 correct
    const attempts = enrollment.exam_attempts + 1;
    const locked = !passed && attempts >= enrollment.max_attempts;

    if (passed) {
      await pool.query(
        `UPDATE enrollments 
         SET exam_attempts = $1, score = $2, passed = $3, completed_at = NOW(), updated_at = NOW()
         WHERE id = $4`,
        [attempts, score, passed, enrollment.id]
      );
    } else {
      await pool.query(
        `UPDATE enrollments 
         SET exam_attempts = $1, score = $2, passed = $3, updated_at = NOW()
         WHERE id = $4`,
        [attempts, score, passed, enrollment.id]
      );
    }

    return NextResponse.json({
      success: true,
      score,
      total: 15,
      passed,
      attempts,
      maxAttempts: enrollment.max_attempts,
      locked,
    });
  } catch (error: any) {
    console.error("Exam submit error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
