import { NextRequest, NextResponse } from "next/server";
import { pool, dbRowToTraining, dbRowToQuestion, dbRowToEnrollment, isDbConnected } from "@/app/lib/server-db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const trainingId = parseInt(id);
    const { searchParams } = new URL(req.url);
    const driverId = searchParams.get("driverId");

    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    const trainingResult = await pool.query(
      "SELECT * FROM trainings WHERE id = $1",
      [trainingId]
    );

    if (trainingResult.rows.length === 0) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    const training = dbRowToTraining(trainingResult.rows[0]);

    const questionsResult = await pool.query(
      "SELECT * FROM questions WHERE training_id = $1",
      [trainingId]
    );

    const questions = questionsResult.rows.map(dbRowToQuestion);

    let enrollment = null;
    if (driverId) {
      const enrollmentResult = await pool.query(
        "SELECT * FROM enrollments WHERE driver_id = $1 AND training_id = $2",
        [driverId, trainingId]
      );
      if (enrollmentResult.rows.length > 0) {
        enrollment = dbRowToEnrollment(enrollmentResult.rows[0]);
      }
    }

    return NextResponse.json({
      success: true,
      training: {
        ...training,
        questions,
        enrollment,
      },
    });
  } catch (error: any) {
    console.error("Training detail error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
