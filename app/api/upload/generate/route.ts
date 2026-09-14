import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cookieName, validSession } from "@/lib/auth";
import { geminiJson, youtubeDetails } from "@/lib/upload";

async function authorized() { return validSession((await cookies()).get(cookieName)?.value); }

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const source = String(body.source || "").trim();
  const youtubeUrl = String(body.youtubeUrl || "").trim();
  if (!source) return NextResponse.json({ error: "Paste the lyrics or song data first." }, { status: 400 });
  try {
    const youtube = await youtubeDetails(youtubeUrl);
    const result = await geminiJson(`You are a careful lyrics publishing assistant. Return ONLY valid JSON matching this shape exactly:
{"title":"","romanTitle":"","language":"hindi|nepali|english","artist":"","composer":"","lyricist":"","album":"","releaseYear":"","songKey":"","tempo":"","songType":"","genres":[],"categories":[],"themes":[],"occasions":[],"excerpt":"","seo":{"title":"","description":""},"slug":"","lyrics":[{"label":"Verse 1","original":"","roman":""}]}
Use the pasted source as the lyric source of truth. Never invent missing lyric lines. Keep existing lyrics, split them into sensible sections, and put a Roman transliteration in roman only when it is present or confidently derivable. Infer classification and SEO from the source and YouTube metadata, but leave unknown person/details as empty strings. The SEO description should be natural and specific, not keyword spam.
YouTube metadata: ${JSON.stringify(youtube)}
Pasted source:
${source}`);
    return NextResponse.json({ song: { ...result, youtubeUrl, youtube } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not generate song details." }, { status: 502 });
  }
}
