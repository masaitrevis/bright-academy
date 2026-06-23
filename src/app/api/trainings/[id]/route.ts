import { NextRequest, NextResponse } from "next/server";
import { pool, dbRowToTraining, dbRowToEnrollment, isDbConnected } from "@/app/lib/server-db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const trainingId = parseInt(id);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    const trainingResult = await pool.query(
      "SELECT * FROM trainings WHERE id = $1 AND status = 'active'",
      [trainingId]
    );

    if (trainingResult.rows.length === 0) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    const training = dbRowToTraining(trainingResult.rows[0]);

    // Do NOT include questions in the public response — they leak correct answers.
    // Questions are served separately by the /api/trainings/[id]/exam endpoint.

    let enrollment = null;
    if (userId) {
      const enrollmentResult = await pool.query(
        "SELECT * FROM enrollments WHERE user_id = $1 AND training_id = $2",
        [userId, trainingId]
      );
      if (enrollmentResult.rows.length > 0) {
        enrollment = dbRowToEnrollment(enrollmentResult.rows[0]);
      }
    }

    return NextResponse.json({
      success: true,
      training: {
        ...training,
        enrollment,
      },
    });
  } catch (error: any) {
    console.error("Training detail error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
