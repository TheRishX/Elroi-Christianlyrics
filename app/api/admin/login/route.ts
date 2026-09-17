import { NextResponse } from "next/server";
import { cookieName, createSession, missingPortalConfiguration, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const attempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const expected = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now(), entry = attempts.get(key);
  if (entry && entry.resetAt > now && entry.count >= 5) return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });

  const missingConfiguration = missingPortalConfiguration();
  if (missingConfiguration.length) {
    return NextResponse.json(
      {
        error: `Portal login is not configured. Add ${missingConfiguration.join(", ")} in Vercel, then redeploy.`,
        code: "PORTAL_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  if (email !== expected || !verifyPassword(password)) {
    // No credentials are logged. These flags make deployment diagnosis possible
    // from Vercel logs without revealing the email or password.
    attempts.set(key, { count: entry && entry.resetAt > now ? entry.count + 1 : 1, resetAt: now + 15 * 60 * 1000 });
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  attempts.delete(key);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, createSession(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
