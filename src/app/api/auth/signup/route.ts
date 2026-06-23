import { NextRequest, NextResponse } from "next/server";
import { pool, dbRowToUser, isDbConnected } from "@/app/lib/server-db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, phone, password } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Full name, email, and password required" },
        { status: 400 }
      );
    }

    if (pool && (await isDbConnected())) {
      // Check if email already exists in academy_users or drivers
      const existingAcademy = await pool.query(
        "SELECT id FROM academy_users WHERE email = $1",
        [email]
      );
      const existingDriver = await pool.query(
        "SELECT id FROM drivers WHERE email = $1",
        [email]
      );

      if (existingAcademy.rows.length > 0 || existingDriver.rows.length > 0) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `INSERT INTO academy_users (full_name, email, phone, password_hash)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [fullName, email, phone || null, passwordHash]
      );

      const user = result.rows[0];

      const token = `tk_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await pool.query(
        "INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)",
        [user.id, token, expiresAt]
      );

      const safeUser = dbRowToUser(user, "academy");

      return NextResponse.json({
        success: true,
        token,
        user: safeUser,
      });
    } else {
      return NextResponse.json(
        { error: "Database not connected" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "Signup failed" },
      { status: 500 }
    );
  }
}
