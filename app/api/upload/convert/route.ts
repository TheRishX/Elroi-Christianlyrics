import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cookieName, validSession } from "@/lib/auth";
import { geminiJson } from "@/lib/upload";

export async function POST(request: Request) {
  if (!validSession((await cookies()).get(cookieName)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const lyrics = Array.isArray(body.lyrics) ? body.lyrics : [];
  if (!lyrics.length) return NextResponse.json({ error: "Generate or add lyrics first." }, { status: 400 });
  try {
    const result = await geminiJson(`Translate/transliterate these lyrics into natural Hindi Devanagari. Preserve meaning, line boundaries, section labels, and the Roman text exactly. Return ONLY JSON: {"lyrics":[{"label":"","originalLines":[],"romanLines":[]}]}. Do not add or remove lyric lines.
${JSON.stringify(lyrics)}`);
    if (!Array.isArray(result.lyrics) || result.lyrics.length !== lyrics.length) throw new Error("The conversion returned incomplete lyric sections.");
    return NextResponse.json({ lyrics: result.lyrics.map((section: { label?: string; originalLines?: string[]; original?: string }, index: number) => ({ label: String(section.label || lyrics[index].label || `Section ${index + 1}`), originalLines: Array.isArray(section.originalLines) ? section.originalLines.map(String) : String(section.original || "").split("\n"), romanLines: Array.isArray(lyrics[index].romanLines) ? lyrics[index].romanLines : String(lyrics[index].roman || "").split("\n") })) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not convert the lyrics." }, { status: 502 });
  }
}
