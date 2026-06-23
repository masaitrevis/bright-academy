import { NextRequest, NextResponse } from "next/server";
import { pool, dbRowToUser, isDbConnected } from "@/app/lib/server-db";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    if (pool && (await isDbConnected())) {
      const sessionResult = await pool.query(
        "SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()",
        [token]
      );

      if (sessionResult.rows.length === 0) {
        return NextResponse.json({ error: "Session expired" }, { status: 401 });
      }

      const userId = sessionResult.rows[0].user_id;

      // Try academy_users first
      const academyResult = await pool.query(
        "SELECT * FROM academy_users WHERE id = $1",
        [userId]
      );

      if (academyResult.rows.length > 0) {
        const user = dbRowToUser(academyResult.rows[0], "academy");
        return NextResponse.json({ success: true, user });
      }

      // Fall back to drivers table
      const driverResult = await pool.query(
        "SELECT * FROM drivers WHERE id = $1",
        [userId]
      );

      if (driverResult.rows.length > 0) {
        const user = dbRowToUser(driverResult.rows[0], "driver");
        return NextResponse.json({ success: true, user });
      }

      return NextResponse.json({ error: "User not found" }, { status: 404 });
    } else {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
