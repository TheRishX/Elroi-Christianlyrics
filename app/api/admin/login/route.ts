import { NextResponse } from "next/server";
import { cookieName, createSession, hasPasswordConfiguration, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  // This is the portal's fixed permitted account. ADMIN_EMAIL remains supported
  // for a future owner change, but an empty legacy variable cannot break login.
  const expected = (process.env["ADMIN_EMAIL"] || "Therishx@gmail.com").trim().toLowerCase();

  if (!hasPasswordConfiguration()) {
    return NextResponse.json(
      { error: "Portal login is not configured. Add ADMIN_PASSWORD in Vercel, then redeploy." },
      { status: 503 },
    );
  }

  if (email !== expected || !verifyPassword(password)) {
    // No credentials are logged. These flags make deployment diagnosis possible
    // from Vercel logs without revealing the email or password.
    console.warn("Admin login rejected", { emailMatches: email === expected, passwordProvided: password.length > 0 });
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

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
