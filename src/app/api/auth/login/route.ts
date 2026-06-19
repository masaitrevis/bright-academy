import { NextRequest, NextResponse } from "next/server";
import { pool, dbRowToDriver, isDbConnected } from "@/app/lib/server-db";
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
      const result = await pool.query(
        "SELECT * FROM drivers WHERE email = $1",
        [email]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      const driver = result.rows[0];
      const valid = await bcrypt.compare(password, driver.password_hash);

      if (!valid) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      const token = `tk_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await pool.query(
        "INSERT INTO sessions (driver_id, token, expires_at) VALUES ($1, $2, $3)",
        [driver.id, token, expiresAt]
      );

      const safeDriver = dbRowToDriver(driver);
      delete (safeDriver as any).passwordHash;

      return NextResponse.json({
        success: true,
        token,
        driver: safeDriver,
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
