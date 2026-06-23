import { NextRequest, NextResponse } from "next/server";
import { pool, dbRowToEnrollment, isDbConnected } from "@/app/lib/server-db";

async function verifyUserToken(req: NextRequest): Promise<{ valid: boolean; userId?: number }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false };
  }
  const token = authHeader.substring(7);

  if (!pool || !(await isDbConnected())) {
    return { valid: false };
  }

  const sessionResult = await pool.query(
    "SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW()",
    [token]
  );

  if (sessionResult.rows.length === 0) {
    return { valid: false };
  }

  return { valid: true, userId: sessionResult.rows[0].user_id };
}

export async function POST(req: NextRequest) {
  try {
    const { valid, userId: authUserId } = await verifyUserToken(req);
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, trainingId, paymentReference } = body;

    if (!userId || !trainingId) {
      return NextResponse.json({ error: "Missing userId or trainingId" }, { status: 400 });
    }

    if (parseInt(userId) !== authUserId) {
      return NextResponse.json({ error: "Unauthorized — user mismatch" }, { status: 403 });
    }

    if (!pool || !(await isDbConnected())) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    // Check if already enrolled
    const existing = await pool.query(
      "SELECT * FROM enrollments WHERE user_id = $1 AND training_id = $2",
      [userId, trainingId]
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
      `INSERT INTO enrollments (user_id, training_id, paid, payment_reference)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, trainingId, !!paymentReference, paymentReference || null]
    );

    const enrollment = dbRowToEnrollment(result.rows[0]);
    return NextResponse.json({ success: true, enrollment });
  } catch (error: any) {
    console.error("Enrollment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
