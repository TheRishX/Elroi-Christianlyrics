import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const todoCookieName = "elroi_todo_access";

// Older releases scoped this cookie to /todo, which prevented the task API
// under /api/todo from receiving it. Copy it to the root scope once so an
// already-authorized session continues working without forcing re-entry.
export function proxy(request: NextRequest) {
  const legacySession = request.cookies.get(todoCookieName)?.value;
  if (!legacySession || request.nextUrl.pathname !== "/todo")
    return NextResponse.next();
  const response = NextResponse.next();
  response.cookies.set(todoCookieName, legacySession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}

export const config = { matcher: "/todo" };
