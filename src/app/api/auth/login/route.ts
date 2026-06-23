import { NextRequest, NextResponse } from "next/server";
import { pool, dbRowToUser, findUserByEmail, isDbConnected } from "@/app/lib/server-db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    if (pool && (await isDbConnected())) {
      const found = await findUserByEmail(email);

      if (!found) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      const { user, source } = found;
      const valid = await bcrypt.compare(password, user.password_hash);

      if (!valid) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      const token = `tk_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await pool.query(
        "INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)",
        [user.id, token, expiresAt]
      );

      const safeUser = dbRowToUser(user, source);

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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 500 }
    );
  }
}
