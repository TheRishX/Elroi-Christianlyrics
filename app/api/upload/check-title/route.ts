import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSongs } from "@/lib/api";
import { cookieName, validSession } from "@/lib/auth";
import { Song } from "@/lib/types";
import { lyricSearchText } from "@/lib/lyrics";

function key(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
function songNameKey(value: string) {
  const original = key(value);
  let normalized = original;
  let previous = "";
  while (normalized && normalized !== previous) {
    previous = normalized;
    normalized = normalized.replace(/\s+(?:(?:hindi|nepali|english)\s+)?(?:christian\s+)?(?:worship\s+)?(?:song|lyrics)(?:\s+(?:song|lyrics))?$/i, "").trim();
  }
  return normalized || original;
}
function titleNames(song: Song) {
  return [song.title, song.romanTitle || "", ...(song.alternateTitles || []), ...(song.romanAlternateTitles || [])].map(songNameKey).filter(Boolean);
}
function lyricWords(song: Song) {
  return key((song.lyrics || []).map(lyricSearchText).join(" ")).split(" ").filter(Boolean);
}
function lyricSimilarity(lyrics: string, second: Song) {
  const firstWords = key(lyrics).split(" ").filter(Boolean), secondWords = lyricWords(second);
  if (firstWords.length < 8 || secondWords.length < 8) return 0;
  const firstSet = new Set(firstWords), secondSet = new Set(secondWords);
  const shared = [...firstSet].filter((word) => secondSet.has(word)).length;
  const union = new Set([...firstSet, ...secondSet]).size;
  const smaller = Math.min(firstSet.size, secondSet.size);
  return Math.max(shared / union, shared / smaller);
}
function similarity(title: string, song: Song, lyrics = "") {
  const wanted = songNameKey(title), wantedWords = new Set(wanted.split(" "));
  const titleScore = Math.max(...titleNames(song).map((name) => {
    if (name === wanted) return 1;
    const words = new Set(name.split(" "));
    const overlap = [...wantedWords].filter((word) => words.has(word)).length;
    if (wantedWords.size < 2 || words.size < 2) return 0;
    return overlap / Math.max(wantedWords.size, words.size) + (name.includes(wanted) || wanted.includes(name) ? 0.45 : 0);
  }));
  const lyricScore = lyrics ? lyricSimilarity(lyrics, song) : 0;
  return Math.max(titleScore, lyricScore >= 0.92 ? 1 : lyricScore * 0.9);
}

async function findMatches(title: string, lyrics = "") {
  const ranked = (await getSongs(undefined, true)).map((song) => ({ song, score: similarity(title, song, lyrics) })).filter(({ score }) => score >= 0.35).sort((a, b) => b.score - a.score).slice(0, 8);
  return { items: ranked.map(({ song }) => song), exact: ranked.some(({ score }) => score === 1) };
}

export async function GET(request: Request) {
  if (!validSession((await cookies()).get(cookieName)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const title = new URL(request.url).searchParams.get("title")?.trim() || "";
  if (!title) return NextResponse.json({ items: [] });
  try {
    return NextResponse.json(await findMatches(title), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not check the existing song library." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  if (!validSession((await cookies()).get(cookieName)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const lyrics = Array.isArray(body.lyrics) ? body.lyrics.map((section: { original?: string; roman?: string; originalLines?: string[]; romanLines?: string[] }) => [...(section.originalLines || (section.original || "").split("\n")), ...(section.romanLines || (section.roman || "").split("\n"))].join(" ")).join(" ") : String(body.lyrics || "");
    if (!title) return NextResponse.json({ items: [] });
    return NextResponse.json(await findMatches(title, lyrics), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not check the existing song library." }, { status: 502 });
  }
}
