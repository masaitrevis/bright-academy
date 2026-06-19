import { NextRequest, NextResponse } from "next/server";
import { pool, isDbConnected } from "@/app/lib/server-db";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    if (pool && (await isDbConnected())) {
      const sessionResult = await pool.query(
        `SELECT s.*, d.* FROM sessions s
         JOIN drivers d ON s.driver_id = d.id
         WHERE s.token = $1 AND s.expires_at > NOW()`,
        [token]
      );

      if (sessionResult.rows.length === 0) {
        return NextResponse.json({ error: "Session expired" }, { status: 401 });
      }

      const row = sessionResult.rows[0];
      const driver = {
        id: row.driver_id,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone,
        classification: row.classification,
      };

      return NextResponse.json({ success: true, driver });
    } else {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
