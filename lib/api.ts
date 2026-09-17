import { songs as mockSongs } from "./mock-data";
import { AdSettings, Artist, Language, SearchResult, Song, SongSuggestion, Video, VideoCategory } from "./types";
import { lyricLines, normalizeLyricText } from "./lyrics";
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
function artistListFrom(data: unknown): Artist[] {
  if (Array.isArray(data)) return data as Artist[];
  if (data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)) return (data as { items: Artist[] }).items;
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
  return { ...song, lyrics: (song.lyrics || []).map(section => {
    const originalLines = lyricLines(section);
    const romanLines = lyricLines(section, true);
    return {
      ...section,
      originalLines: originalLines.map((line, index) => repairDevanagari(line, romanLines[index] || "").normalize("NFC")),
      romanLines,
    };
  }) };
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
export async function getArtists(fresh = false): Promise<Artist[]> {
  if (!base) {
    return Array.from(new Map(mockSongs.flatMap((song) => [song.artist, song.worshipTeam || ""]).filter(Boolean).map((name) => [name.toLowerCase(), { id: 0, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name }] as const)).values()).sort((a, b) => a.name.localeCompare(b.name));
  }
  try {
    const requestInit = fresh ? { cache: "no-store" as const } : { next: { revalidate: 300, tags: ["artists"] } };
    const [artistsResponse, profilesResponse] = await Promise.all([
      fetch(`${base}/artists`, requestInit),
      fetch(`${base}/artist-profiles`, requestInit),
    ]);
    if (!artistsResponse.ok && !profilesResponse.ok) throw new Error("WordPress unavailable");
    const [artistsData, profilesData] = await Promise.all([
      artistsResponse.ok ? artistsResponse.json() : Promise.resolve({ items: [] }),
      profilesResponse.ok ? profilesResponse.json() : Promise.resolve({ items: [] }),
    ]);
    const merged = new Map<string, Artist>();
    for (const artist of [...artistListFrom(artistsData), ...artistListFrom(profilesData)]) {
      const key = artist.name.trim().toLowerCase();
      const existing = merged.get(key);
      merged.set(key, {
        ...(existing || artist),
        ...artist,
        name: artist.name.trim(),
        image: artist.image || existing?.image || "",
      });
    }
    return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return Array.from(new Map(mockSongs.flatMap((song) => [song.artist, song.worshipTeam || ""]).filter(Boolean).map((name) => [name.toLowerCase(), { id: 0, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name }] as const)).values()).sort((a, b) => a.name.localeCompare(b.name));
  }
}
export async function getAdSettings(): Promise<AdSettings | null> {
  if (!base) return null;
  try {
    const response = await fetch(`${base}/settings/ads`, { next: { revalidate: 60, tags: ["ads"] } });
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
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
export async function getVideoCategories(fresh = false): Promise<VideoCategory[]> {
  if (!base) return [];
  try {
    const response = await fetch(`${base}/video-categories`, fresh ? { cache: "no-store" } : { next: { revalidate: 300, tags: ["video-categories"] } });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : data.items || [];
  } catch { return []; }
}
export async function getVideos(options: { category?: string; featured?: boolean; language?: Language; type?: string; reels?: boolean; q?: string; limit?: number; fresh?: boolean } = {}): Promise<Video[]> {
  if (!base) return [];
  try {
    const url = new URL(`${base}/videos`);
    if (options.category) url.searchParams.set("category", options.category);
    if (options.featured) url.searchParams.set("featured", "1");
    if (options.language) url.searchParams.set("language", options.language);
    if (options.type) url.searchParams.set("type", options.type);
    if (options.reels) url.searchParams.set("reels", "1");
    if (options.q) url.searchParams.set("q", options.q);
    if (options.limit) url.searchParams.set("limit", String(options.limit));
    const response = await fetch(url, options.fresh ? { cache: "no-store" } : { next: { revalidate: 120, tags: ["videos"] } });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : data.items || [];
  } catch { return []; }
}
export async function getVideo(slug: string): Promise<Video | undefined> {
  if (!base) return undefined;
  try {
    const response = await fetch(`${base}/videos/${encodeURIComponent(slug)}`, { next: { revalidate: 120, tags: [`video:${slug}`] } });
    return response.ok ? await response.json() : undefined;
  } catch { return undefined; }
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
  const lyrics = song.lyrics.map((l) => lyricLines(l).join(" ")).join(" ");
  const rlyrics = song.lyrics.map((l) => lyricLines(l, true).join(" ")).join(" ");
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
