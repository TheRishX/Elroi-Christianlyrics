import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cookieName, validSession } from "@/lib/auth";
import { validateSong } from "@/lib/upload";
import { publisherBase, publisherHeaders, UpstreamError, upstreamResponse, wordpressFetch } from "@/lib/wordpress";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!validSession((await cookies()).get(cookieName)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const song = validateSong(await request.json());
    const idempotencyKey = request.headers.get("idempotency-key");
    if (!idempotencyKey || idempotencyKey.length > 128) return NextResponse.json({ error: "An idempotency key is required." }, { status: 400 });
    const response = await wordpressFetch(`${publisherBase()}/songs`, { method: "POST", headers: { ...publisherHeaders(), "Idempotency-Key": idempotencyKey }, body: JSON.stringify(song) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) upstreamResponse(data, response, "WordPress could not create this song.");
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create the song." }, { status: error instanceof UpstreamError ? error.status : 422 });
  }
}
