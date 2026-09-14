import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cookieName, validSession } from "@/lib/auth";
import { validateSong } from "@/lib/upload";

function publisherUrl() {
  if (process.env.WORDPRESS_PUBLISH_URL) return process.env.WORDPRESS_PUBLISH_URL.replace(/\/$/, "");
  const api = process.env.WORDPRESS_API_URL;
  if (!api) throw new Error("WordPress is not configured yet. Add WORDPRESS_API_URL in Vercel.");
  return new URL("/wp-json/elroi-publisher/v1/songs", api).toString();
}

export async function POST(request: Request) {
  if (!validSession((await cookies()).get(cookieName)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const song = validateSong(await request.json());
    const token = process.env.WORDPRESS_API_TOKEN;
    if (!token) throw new Error("WordPress publishing is not configured yet. Add WORDPRESS_API_TOKEN in Vercel.");
    const response = await fetch(publisherUrl(), { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", "X-Elroi-API-Token": token, Authorization: `Bearer ${token}` }, body: JSON.stringify(song), cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || "WordPress could not publish this song.");
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not publish the song." }, { status: 502 });
  }
}
