import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cookieName, validSession } from "@/lib/auth";

export async function POST(request: Request) {
  if (!validSession((await cookies()).get(cookieName)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const api = process.env.WORDPRESS_API_URL, token = process.env.WORDPRESS_API_TOKEN;
  if (!api || !token) return NextResponse.json({ error: "WordPress publishing is not configured yet." }, { status: 503 });
  try {
    const body = await request.json();
    const response = await fetch(`${api.replace(/\/$/, "")}/settings/ads/upload`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", "X-Elroi-API-Token": token, Authorization: `Bearer ${token}` }, body: JSON.stringify(body), cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: data.message || data.error || "Banner upload failed." }, { status: response.status });
    return NextResponse.json(data);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Banner upload failed." }, { status: 502 }); }
}
