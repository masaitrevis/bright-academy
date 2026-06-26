import { NextRequest, NextResponse } from "next/server";
import { pool, isDbConnected } from "@/app/lib/server-db";

// Get 15 random questions for a training + timer info
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const trainingId = parseInt(id);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    // Get training to check timer and free status
    const trainingResult = await pool.query(
      "SELECT time_limit, is_free FROM trainings WHERE id = $1",
      [trainingId]
    );
    if (trainingResult.rows.length === 0) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }
    const training = trainingResult.rows[0];

    let timeRemaining = null;
    let startedAt = null;

    if (userId) {
      const enrollmentResult = await pool.query(
        "SELECT id, exam_started_at, exam_attempts, max_attempts, passed FROM enrollments WHERE user_id = $1 AND training_id = $2",
        [userId, trainingId]
      );

      if (enrollmentResult.rows.length > 0) {
        const enrollment = enrollmentResult.rows[0];

        if (enrollment.passed) {
          return NextResponse.json({ error: "Already passed" }, { status: 403 });
        }
        if (enrollment.exam_attempts >= enrollment.max_attempts) {
          return NextResponse.json({ error: "Maximum attempts reached" }, { status: 403 });
        }

        // Set exam_started_at on first fetch of this attempt
        if (!enrollment.exam_started_at) {
          await pool.query(
            "UPDATE enrollments SET exam_started_at = NOW() WHERE id = $1",
            [enrollment.id]
          );
          startedAt = new Date().toISOString();
        } else {
          startedAt = enrollment.exam_started_at;
        }

        // Calculate remaining time
        if (training.time_limit && training.time_limit > 0) {
          const startTime = new Date(startedAt).getTime();
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          const limitSeconds = training.time_limit * 60;
          timeRemaining = Math.max(0, limitSeconds - elapsedSeconds);

          if (timeRemaining <= 0) {
            // Time expired — auto-fail this attempt
            await pool.query(
              `UPDATE enrollments 
               SET exam_attempts = exam_attempts + 1, exam_started_at = NULL, score = 0, passed = FALSE, updated_at = NOW()
               WHERE id = $1`,
              [enrollment.id]
            );
            return NextResponse.json({
              error: "Time limit exceeded",
              attempts: enrollment.exam_attempts + 1,
              maxAttempts: enrollment.max_attempts,
            }, { status: 403 });
          }
        }
      }
    }

    const result = await pool.query(
      `SELECT id, question, options FROM questions 
       WHERE training_id = $1 
       ORDER BY RANDOM() 
       LIMIT 15`,
      [trainingId]
    );

    return NextResponse.json({
      success: true,
      questions: result.rows,
      timeLimit: training.time_limit || 0,
      isFree: training.is_free || false,
      timeRemaining,
      startedAt,
    });
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
    const { userId, answers } = body;

    if (!userId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    // Get enrollment
    const enrollmentResult = await pool.query(
      "SELECT * FROM enrollments WHERE user_id = $1 AND training_id = $2",
      [userId, trainingId]
    );

    if (enrollmentResult.rows.length === 0) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }

    const enrollment = enrollmentResult.rows[0];

    // Check timer expiry on submit
    if (enrollment.exam_started_at) {
      const trainingResult = await pool.query(
        "SELECT time_limit FROM trainings WHERE id = $1",
        [trainingId]
      );
      const timeLimit = trainingResult.rows[0]?.time_limit || 0;
      if (timeLimit > 0) {
        const startTime = new Date(enrollment.exam_started_at).getTime();
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        if (elapsedSeconds > timeLimit * 60) {
          // Reset timer, record failed attempt
          const newAttempts = enrollment.exam_attempts + 1;
          await pool.query(
            `UPDATE enrollments 
             SET exam_attempts = exam_attempts + 1, exam_started_at = NULL, score = 0, passed = FALSE, updated_at = NOW()
             WHERE id = $1`,
            [enrollment.id]
          );
          return NextResponse.json({
            error: "Time limit exceeded",
            attempts: newAttempts,
            maxAttempts: enrollment.max_attempts,
          }, { status: 403 });
        }
      }
    }

    if (!enrollment.paid) {
      // Check if training is free
      const trainingResult = await pool.query(
        "SELECT is_free FROM trainings WHERE id = $1",
        [trainingId]
      );
      const isFree = trainingResult.rows[0]?.is_free || false;
      if (!isFree) {
        return NextResponse.json({ error: "Payment required" }, { status: 403 });
      }
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
         SET exam_attempts = $1, score = $2, passed = $3, completed_at = NOW(), exam_started_at = NULL, updated_at = NOW()
         WHERE id = $4`,
        [attempts, score, passed, enrollment.id]
      );
    } else {
      await pool.query(
        `UPDATE enrollments 
         SET exam_attempts = $1, score = $2, passed = $3, exam_started_at = NULL, updated_at = NOW()
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
