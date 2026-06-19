import { NextRequest, NextResponse } from "next/server";
import { pool, dbRowToEnrollment, isDbConnected } from "@/app/lib/server-db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { driverId, trainingId, paymentReference } = body;

    if (!driverId || !trainingId) {
      return NextResponse.json({ error: "Missing driverId or trainingId" }, { status: 400 });
    }

    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    // Check if already enrolled
    const existing = await pool.query(
      "SELECT * FROM enrollments WHERE driver_id = $1 AND training_id = $2",
      [driverId, trainingId]
    );

    if (existing.rows.length > 0) {
      const enrollment = existing.rows[0];
      if (!enrollment.paid && paymentReference) {
        // Update payment
        await pool.query(
          "UPDATE enrollments SET paid = true, payment_reference = $1 WHERE id = $2",
          [paymentReference, enrollment.id]
        );
        return NextResponse.json({ success: true, message: "Payment confirmed" });
      }
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
    }

    // Create new enrollment
    const result = await pool.query(
      `INSERT INTO enrollments (driver_id, training_id, paid, payment_reference)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [driverId, trainingId, !!paymentReference, paymentReference || null]
    );

    const enrollment = dbRowToEnrollment(result.rows[0]);
    return NextResponse.json({ success: true, enrollment });
  } catch (error: any) {
    console.error("Enrollment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
