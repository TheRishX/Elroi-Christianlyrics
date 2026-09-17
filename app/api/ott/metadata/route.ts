import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cookieName, validSession } from "@/lib/auth";

function extractId(value: string) { try { const url = new URL(value.trim()); const host = url.hostname.replace(/^www\./, ""); if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || ""; if (!["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) return ""; return url.searchParams.get("v") || url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/)?.[1] || ""; } catch { return ""; } }
function isoDuration(value: string) { const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/); if (!match) return value; const [, hours = "0", minutes = "0", seconds = "0"] = match; return [hours !== "0" ? `${hours}:` : "", `${minutes}`.padStart(hours !== "0" ? 2 : 1, "0"), `:${seconds.padStart(2, "0")}`].join(""); }
export async function POST(request: Request) {
  if (!validSession((await cookies()).get(cookieName)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { youtubeUrl } = await request.json().catch(() => ({})); const youtubeId = extractId(String(youtubeUrl || ""));
  if (!youtubeId) return NextResponse.json({ error: "Paste a valid YouTube link." }, { status: 400 });
  const key = process.env.YOUTUBE_API_KEY; if (!key) return NextResponse.json({ error: "YouTube metadata is not configured. Add YOUTUBE_API_KEY to the server environment." }, { status: 503 });
  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${encodeURIComponent(youtubeId)}&key=${encodeURIComponent(key)}`, { cache: "no-store" });
    if (!response.ok) throw new Error("YouTube could not be reached."); const item = (await response.json()).items?.[0];
    if (!item) return NextResponse.json({ error: "This YouTube video was not found or is private." }, { status: 404 });
    if (item.status?.privacyStatus !== "public" || !item.status?.embeddable) return NextResponse.json({ error: "This YouTube video is not public and embeddable." }, { status: 400 });
    const thumbnails = item.snippet?.thumbnails || {}; const thumbnailUrl = thumbnails.maxres?.url || thumbnails.standard?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    return NextResponse.json({ youtubeId, title: item.snippet?.title || "", description: item.snippet?.description || "", thumbnailUrl, channelName: item.snippet?.channelTitle || "", channelId: item.snippet?.channelId || "", duration: isoDuration(item.contentDetails?.duration || ""), sourcePublishedAt: item.snippet?.publishedAt || "", embeddable: true, privacyStatus: "public" });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "YouTube metadata could not be loaded." }, { status: 502 }); }
}
