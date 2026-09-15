import { songs as mockSongs } from "./mock-data";
import { Language, SearchResult, Song, SongSuggestion } from "./types";
import { normalizeLyricText } from "./lyrics";
const base = process.env.WORDPRESS_API_URL;
function listFrom(data: unknown): Song[] {
  if (Array.isArray(data)) return data as Song[];
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { items?: unknown }).items)
  )
    return (data as { items: Song[] }).items;
  return [];
}
function repairDevanagari(value: string, roman = "") {
  const nativeLines = value.split("\n");
  const romanLines = roman.split("\n");
  return nativeLines.map((line, index) => {
    const leading = line.match(/^\s*/)?.[0] || "";
    const text = line.slice(leading.length);
    if (!text) return line;
    const first = Array.from(text)[0];
    // A leading Devanagari combining mark has lost its base character and
    // otherwise renders as a dotted circle. Restore the missing अ.
    if (first && /\p{Mark}/u.test(first)) return `${leading}अ${text}`;
    // Preserve the common Roman/native pair: "Ab ..." must render as "अब ...".
    if (/^ab(?:\s|$)/iu.test((romanLines[index] || "").trim()) && /^ब(?:\s|$)/u.test(text)) return `${leading}अ${text}`;
    return line;
  }).join("\n");
}
function repairSong(song: Song): Song {
  return { ...song, lyrics: (song.lyrics || []).map(section => ({ ...section, original: repairDevanagari(normalizeLyricText(section.original || ""), normalizeLyricText(section.roman || "")), roman: section.roman ? normalizeLyricText(section.roman) : section.roman })) };
}
export async function getSongs(language?: Language, fresh = false): Promise<Song[]> {
  if (!base)
    return language
      ? mockSongs.filter((s) => s.language === language)
      : mockSongs;
  try {
    const url = new URL(`${base}/songs`);
    if (language) url.searchParams.set("language", language);
    const res = await fetch(url, fresh ? { cache: "no-store" } : {
      next: { revalidate: 300, tags: ["songs"] },
    });
    if (!res.ok) throw new Error("WordPress unavailable");
    return listFrom(await res.json()).map(repairSong);
  } catch {
    return language
      ? mockSongs.filter((s) => s.language === language)
      : mockSongs;
  }
}
export async function getSong(slug: string): Promise<Song | undefined> {
  if (!base) return mockSongs.find((s) => s.slug === slug);
  try {
    const res = await fetch(`${base}/songs/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300, tags: [`song:${slug}`] },
    });
    if (!res.ok) return undefined;
    return repairSong(await res.json());
  } catch {
    return mockSongs.find((s) => s.slug === slug);
  }
}
function fold(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}
function romanVariants(value: string) {
  const folded = fold(value);
  return [
    folded,
    folded.replace(/aa/g, "a"),
    folded.replace(/sh/g, "s"),
    folded.replace(/ee/g, "i"),
    folded.replace(/oo/g, "u"),
  ];
}
function snippet(text: string, q: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  const index = fold(clean).indexOf(fold(q));
  if (index < 0) return clean.slice(0, 110) + (clean.length > 110 ? "…" : "");
  const start = Math.max(0, index - 35);
  const end = Math.min(clean.length, index + Math.max(q.length, 35));
  return (
    (start ? "…" : "") +
    clean.slice(start, end) +
    (end < clean.length ? "…" : "")
  );
}
function rank(song: Song, q: string): SearchResult | undefined {
  const native = fold(q);
  const roman = romanVariants(q);
  const title = fold(song.title);
  const rt = romanVariants(song.romanTitle || "");
  const artist = fold(song.artist || "");
  const alt = [
    ...(song.alternateTitles || []),
    ...(song.romanAlternateTitles || []),
  ].flatMap(romanVariants);
  const lyrics = song.lyrics.map((l) => l.original).join(" ");
  const rlyrics = song.lyrics.map((l) => l.roman || "").join(" ");
  let matchType: SearchResult["matchType"];
  let score = 0;
  let matchText = "";
  if (title === native || title.includes(native)) {
    matchType = "title";
    score = 100;
    matchText = song.title;
  } else if (
    rt.some((v) => v === native || v.includes(native)) ||
    alt.some((v) => v === native || v.includes(native))
  ) {
    matchType = "roman_title";
    score = 90;
    matchText = song.romanTitle || song.title;
  } else if (artist.includes(native)) {
    matchType = "artist";
    score = 70;
    matchText = song.artist;
  } else if (fold(lyrics).includes(native)) {
    matchType = "lyrics";
    score = 50;
    matchText = lyrics;
  } else if (roman.some((v) => fold(rlyrics).includes(v))) {
    matchType = "roman_lyrics";
    score = 40;
    matchText = rlyrics;
  } else return undefined;
  return {
    ...song,
    matchType,
    snippet:
      matchType === "lyrics" || matchType === "roman_lyrics"
        ? snippet(matchText, q)
        : "",
    _score: score,
  } as SearchResult & { _score: number };
}
export async function suggestSongs(
  query: string,
  language?: Language,
): Promise<SongSuggestion[]> {
  if (base) {
    try {
      const url = new URL(`${base}/suggestions`);
      url.searchParams.set("q", query);
      if (language) url.searchParams.set("language", language);
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        return listFrom(data) as unknown as SongSuggestion[];
      }
    } catch {}
  }
  return mockSongs
    .map((s) => rank(s, query))
    .filter(Boolean)
    .sort(
      (a, b) =>
        (b as SearchResult & { _score: number })._score -
        (a as SearchResult & { _score: number })._score,
    )
    .slice(0, 6)
    .map((s) => ({
      id: s!.id,
      slug: s!.slug,
      title: s!.title,
      romanTitle: s!.romanTitle,
      artist: s!.artist,
      language: s!.language,
      matchType: s!.matchType || "title",
      snippet: s!.snippet,
    }));
}
export async function searchSongs(
  query: string,
  language?: Language,
): Promise<SearchResult[]> {
  if (base) {
    try {
      const url = new URL(`${base}/search`);
      url.searchParams.set("q", query);
      if (language) url.searchParams.set("language", language);
      const res = await fetch(url, {
        next: { revalidate: 60, tags: ["search"] },
      });
      if (res.ok) {
        const data = await res.json();
        return listFrom(data) as SearchResult[];
      }
    } catch {}
  }
  return mockSongs
    .map((s) => rank(s, query))
    .filter(Boolean)
    .sort(
      (a, b) =>
        (b as SearchResult & { _score: number })._score -
        (a as SearchResult & { _score: number })._score,
    ) as SearchResult[];
}
