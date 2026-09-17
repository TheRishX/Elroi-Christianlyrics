import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cookieName, validSession } from "@/lib/auth";
import { publisherBase, publisherHeaders, UpstreamError, upstreamResponse, wordpressFetch } from "@/lib/wordpress";

async function authenticated() { return validSession((await cookies()).get(cookieName)?.value); }
function id(value: unknown) { const parsed = Number(value); return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0; }
function failure(error: unknown, fallback: string) { return NextResponse.json({ error: error instanceof Error ? error.message : fallback }, { status: error instanceof UpstreamError ? error.status : 502 }); }
function compatibilityLyrics(value: unknown) {
  if (!Array.isArray(value)) return value;
  return value.map((section) => {
    if (!section || typeof section !== "object") return section;
    const item = section as Record<string, unknown>;
    const originalLines = Array.isArray(item.originalLines) ? item.originalLines.map(String) : [];
    const romanLines = Array.isArray(item.romanLines) ? item.romanLines.map(String) : [];
    return { ...item, original: originalLines.join("\n"), roman: romanLines.join("\n") };
  });
}
export async function GET(request: Request) {
  if (!await authenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { const page = Math.max(1, Number(new URL(request.url).searchParams.get("page")) || 1); const response = await wordpressFetch(`${publisherBase()}/songs?page=${page}&per_page=50`, { headers: publisherHeaders() }); const data = await response.json().catch(() => ({})); if (!response.ok) upstreamResponse(data, response, "Songs could not be loaded."); return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } }); } catch (error) { return failure(error, "Songs could not be loaded."); }
}
export async function PATCH(request: Request) {
  if (!await authenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { const body = await request.json(); const songId = id(body?.id), revision = Number(body?.revision); if (!songId || !Number.isSafeInteger(revision) || revision < 1) return NextResponse.json({ error: "A song ID and current revision are required." }, { status: 400 }); const { id: _id, ...patch } = body as Record<string, unknown>; if ("lyrics" in patch) patch.lyrics = compatibilityLyrics(patch.lyrics); const response = await wordpressFetch(`${publisherBase()}/songs/${songId}`, { method: "PATCH", headers: { ...publisherHeaders(), "If-Match": String(revision) }, body: JSON.stringify(patch) }); const data = await response.json().catch(() => ({})); if (!response.ok) upstreamResponse(data, response, "Song could not be updated."); return NextResponse.json(data); } catch (error) { return failure(error, "Song could not be updated."); }
}
export async function DELETE(request: Request) {
  if (!await authenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { const songId = id(new URL(request.url).searchParams.get("id")), revision = Number(request.headers.get("if-match")); if (!songId || !Number.isSafeInteger(revision) || revision < 1) return NextResponse.json({ error: "A song ID and current revision are required." }, { status: 400 }); const response = await wordpressFetch(`${publisherBase()}/songs/${songId}`, { method: "DELETE", headers: { ...publisherHeaders(), "If-Match": String(revision) } }); const data = await response.json().catch(() => ({})); if (!response.ok) upstreamResponse(data, response, "Song could not be trashed."); return NextResponse.json(data); } catch (error) { return failure(error, "Song could not be trashed."); }
}
