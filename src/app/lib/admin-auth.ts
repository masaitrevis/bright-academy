import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Admin password from env (fallback for dev — change in production!)
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "BrightAcademy2024!";

export const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_SECRET || "bright-academy-admin-secret-2024";

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  const padding = "=".repeat((4 - (str.length % 4)) % 4);
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/") + padding;
  return Buffer.from(base64, "base64").toString("utf8");
}

// Generate a proper signed JWT-style admin token using HMAC-SHA256
export function generateAdminToken(): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({ role: "admin", iat: Math.floor(Date.now() / 1000) })
  );
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

// Verify admin token from request headers
export function verifyAdminToken(req: NextRequest): { valid: boolean; token?: string } {
  const auth = req.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return { valid: false };
  }
  const token = auth.substring(7);

  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false };
  }

  const [header, payload, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");

  try {
    const signatureValid = crypto.timingSafeEqual(
      Buffer.from(signature, "base64url"),
      Buffer.from(expectedSignature, "base64url")
    );
    if (!signatureValid) {
      return { valid: false };
    }

    const decodedPayload = JSON.parse(base64UrlDecode(payload));
    if (decodedPayload.role !== "admin") {
      return { valid: false };
    }

    return { valid: true, token };
  } catch {
    return { valid: false };
  }
}

// Middleware-style helper: returns NextResponse if unauthorized, null if authorized
export function requireAdmin(req: NextRequest): NextResponse | null {
  const { valid } = verifyAdminToken(req);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized — admin access required" }, { status: 401 });
  }
  return null;
}
