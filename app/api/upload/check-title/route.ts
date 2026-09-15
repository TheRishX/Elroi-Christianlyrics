import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSongs } from "@/lib/api";
import { cookieName, validSession } from "@/lib/auth";
import { Song } from "@/lib/types";

function key(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
function titleNames(song: Song) {
  return [song.title, song.romanTitle || "", ...(song.alternateTitles || []), ...(song.romanAlternateTitles || [])].map(key).filter(Boolean);
}
function similarity(title: string, song: Song) {
  const wanted = key(title), wantedWords = new Set(wanted.split(" "));
  return Math.max(...titleNames(song).map((name) => {
    if (name === wanted) return 1;
    const words = new Set(name.split(" "));
    const overlap = [...wantedWords].filter((word) => words.has(word)).length;
    return overlap / Math.max(wantedWords.size, words.size) + (name.includes(wanted) || wanted.includes(name) ? 0.45 : 0);
  }));
}

export async function GET(request: Request) {
  if (!validSession((await cookies()).get(cookieName)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const title = new URL(request.url).searchParams.get("title")?.trim() || "";
  if (!title) return NextResponse.json({ items: [] });
  try {
    const ranked = (await getSongs(undefined, true)).map((song) => ({ song, score: similarity(title, song) })).filter(({ score }) => score >= 0.35).sort((a, b) => b.score - a.score).slice(0, 8);
    const items = ranked.map(({ song }) => song);
    return NextResponse.json({ items, exact: ranked.some(({ score }) => score === 1) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not check the existing song library." }, { status: 502 });
  }
}
