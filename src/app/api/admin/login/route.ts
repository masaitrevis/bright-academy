import { NextRequest, NextResponse } from "next/server";
import { ADMIN_PASSWORD, generateAdminToken } from "@/app/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
    }

    const token = generateAdminToken();
    return NextResponse.json({ success: true, token });
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
