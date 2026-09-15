import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cookieName, validSession } from "@/lib/auth";

function endpoint() {
  const base = process.env.WORDPRESS_API_URL;
  if (!base) throw new Error("WordPress is not configured yet.");
  return `${base.replace(/\/$/, "")}/artists`;
}
function headers() {
  const token = process.env.WORDPRESS_API_TOKEN;
  if (!token) throw new Error("WordPress publishing is not configured yet.");
  return { "Content-Type": "application/json", Accept: "application/json", "X-Elroi-API-Token": token, Authorization: `Bearer ${token}` };
}

export async function GET() {
  if (!validSession((await cookies()).get(cookieName)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const response = await fetch(endpoint(), { headers: headers(), cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    const songsResponse = await fetch(`${process.env.WORDPRESS_API_URL?.replace(/\/$/, "")}/songs?per_page=100`, { cache: "no-store" });
    const songs = await songsResponse.json().catch(() => ({}));
    const profiles = Array.isArray(data.items) ? data.items : [];
    const songArtists = (Array.isArray(songs.items) ? songs.items : []).flatMap((song: { artist?: string; worshipTeam?: string }) => [song.artist, song.worshipTeam]).filter(Boolean).map((name: string) => ({ id: 0, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name, image: "" }));
    const items = (Array.from(new Map([...songArtists, ...profiles].map((artist: { id: number; slug: string; name: string; image?: string }) => [artist.name.trim().toLowerCase(), { id: artist.id || 0, slug: artist.slug, name: artist.name.trim(), image: artist.image || "" }] as const)).values()) as { id: number; slug: string; name: string; image: string }[]).sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Artists could not be loaded." }, { status: 502 }); }
}

export async function POST(request: Request) {
  if (!validSession((await cookies()).get(cookieName)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { const body = await request.json(); const response = await fetch(endpoint(), { method: "POST", headers: headers(), body: JSON.stringify({ name: String(body.name || "").trim(), imageData: typeof body.imageData === "string" ? body.imageData : "" }), cache: "no-store" }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || data.error || "Artist could not be created."); return NextResponse.json(data, { status: response.status }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Artist could not be created." }, { status: 502 }); }
}

export async function PATCH(request: Request) {
  if (!validSession((await cookies()).get(cookieName)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const api = process.env.WORDPRESS_API_URL, token = process.env.WORDPRESS_API_TOKEN;
  try { const body = await request.json(); const response = await fetch(`${api?.replace(/\/$/, "")}/artists/${encodeURIComponent(String(body.id))}`, { method: "PATCH", headers: { "Content-Type": "application/json", Accept: "application/json", "X-Elroi-API-Token": token || "", Authorization: `Bearer ${token || ""}` }, body: JSON.stringify(body), cache: "no-store" }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || data.error || "Artist could not be updated."); return NextResponse.json(data); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Artist could not be updated." }, { status: 502 }); }
}
export async function DELETE(request: Request) {
  if (!validSession((await cookies()).get(cookieName)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const api = process.env.WORDPRESS_API_URL, token = process.env.WORDPRESS_API_TOKEN, id = new URL(request.url).searchParams.get("id");
export async function DELETE(request: Request) { if (!validSession((await cookies()).get(cookieName)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const api = process.env.WORDPRESS_API_URL, token = process.env.WORDPRESS_API_TOKEN, params = new URL(request.url).searchParams, id = params.get("id"), name = params.get("name"); try { const path = id && id !== "0" ? `/artists/${encodeURIComponent(id)}` : `/artists?name=${encodeURIComponent(name || "")}`; if (!id && !name) return NextResponse.json({ error: "Artist id or name is required." }, { status: 400 }); const response = await fetch(`${api?.replace(/\/$/, "")}${path}`, { method: "DELETE", headers: { Accept: "application/json", "X-Elroi-API-Token": token || "", Authorization: `Bearer ${token || ""}` }, cache: "no-store" }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || data.error || "Artist could not be deleted."); return NextResponse.json(data); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Artist could not be deleted." }, { status: 502 }); } }
}
