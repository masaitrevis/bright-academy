import { NextRequest, NextResponse } from "next/server";

// Admin password from env (fallback for dev — change in production!)
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "BrightAcademy2024!";

// Simple admin token prefix
const ADMIN_PREFIX = "admin_";

// Generate a simple admin token
export function generateAdminToken(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${ADMIN_PREFIX}${timestamp}_${random}`;
}

// Verify admin token from request headers
export function verifyAdminToken(req: NextRequest): { valid: boolean; token?: string } {
  const auth = req.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return { valid: false };
  }
  const token = auth.substring(7);
  if (!token.startsWith(ADMIN_PREFIX) || token.length < ADMIN_PREFIX.length + 5) {
    return { valid: false };
  }
  return { valid: true, token };
}

// Middleware-style helper: returns NextResponse if unauthorized, null if authorized
export function requireAdmin(req: NextRequest): NextResponse | null {
  const { valid } = verifyAdminToken(req);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized — admin access required" }, { status: 401 });
  }
  return null;
}
