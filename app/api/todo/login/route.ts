import { NextResponse } from "next/server";
import { createTodoSession, todoCookieName, verifyTodoPasscode } from "@/lib/todo-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const passcode = String(body.passcode || "");
  if (!verifyTodoPasscode(passcode)) return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(todoCookieName, createTodoSession(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/todo", maxAge: 60 * 60 * 8 });
  return response;
}
