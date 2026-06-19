import { NextRequest, NextResponse } from "next/server";
import { pool, dbRowToTraining, dbRowToEnrollment, isDbConnected } from "@/app/lib/server-db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const driverId = searchParams.get("driverId");

    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    const trainingsResult = await pool.query(
      "SELECT * FROM trainings WHERE status = 'active' ORDER BY created_at DESC"
    );

    const trainings = trainingsResult.rows.map(dbRowToTraining);

    if (driverId) {
      const enrollmentsResult = await pool.query(
        "SELECT * FROM enrollments WHERE driver_id = $1",
        [driverId]
      );
      const enrollments = enrollmentsResult.rows.map(dbRowToEnrollment);

      const trainingsWithStatus = trainings.map((t) => {
        const enrollment = enrollments.find((e) => e.trainingId === t.id);
        return {
          ...t,
          enrollment: enrollment || null,
        };
      });

      return NextResponse.json({ success: true, trainings: trainingsWithStatus });
    }

    return NextResponse.json({ success: true, trainings });
  } catch (error: any) {
    console.error("Trainings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
