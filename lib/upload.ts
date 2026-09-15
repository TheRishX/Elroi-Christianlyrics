import { Song } from "./types";
import { normalizeLyricText } from "./lyrics";

export type UploadSong = Omit<Song, "id" | "updatedAt"> & {
  status?: "draft" | "publish";
  artistId?: number;
};

const languages = ["hindi", "nepali", "english"] as const;

export function isLanguage(value: unknown): value is Song["language"] {
  return typeof value === "string" && languages.includes(value as never);
}

export function cleanLyrics(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((section) => ({
      label: String(section?.label || "Section").trim(),
      original: normalizeLyricText(section?.original || "").trim(),
      ...(section?.roman ? { roman: normalizeLyricText(section.roman).trim() } : {}),
    }))
    .filter((section) => section.original || section.roman);
}

export function validateSong(value: unknown): UploadSong {
  const input = (value || {}) as Record<string, unknown>;
  const title = String(input.title || "").trim();
  const artist = String(input.artist || "").trim();
  const language = input.language;
  const lyrics = cleanLyrics(input.lyrics);
  if (!title) throw new Error("A song title is required.");
  if (!artist) throw new Error("An artist or worship team is required.");
  if (!isLanguage(language)) throw new Error("Choose Hindi, Nepali, or English.");
  if (!lyrics.length) throw new Error("Add at least one lyric section before publishing.");
  return {
    ...input,
    title,
    artist,
    language,
    lyrics,
    slug: String(input.slug || title).trim(),
    romanTitle: String(input.romanTitle || "").trim() || undefined,
    genres: Array.isArray(input.genres) ? input.genres.map(String).filter(Boolean) : [],
    categories: Array.isArray(input.categories) ? input.categories.map(String).filter(Boolean) : [],
    themes: Array.isArray(input.themes) ? input.themes.map(String).filter(Boolean) : [],
    occasions: Array.isArray(input.occasions) ? input.occasions.map(String).filter(Boolean) : [],
    status: input.status === "draft" ? "draft" : "publish",
  } as UploadSong;
}

export async function youtubeDetails(url: string) {
  if (!url.trim()) return { source: "none" as const };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Paste a valid YouTube URL.");
  }
  const videoId = parsed.hostname.includes("youtu.be")
    ? parsed.pathname.slice(1)
    : parsed.searchParams.get("v");
  if (!videoId) throw new Error("That YouTube URL does not include a video ID.");
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return { source: "url" as const, videoId, url };
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(key)}`,
    { cache: "no-store" },
  );
  if (!response.ok) throw new Error("YouTube metadata could not be fetched. Check the API key or quota.");
  const data = await response.json();
  const item = data.items?.[0];
  if (!item) throw new Error("That YouTube video could not be found.");
  const snippet = item.snippet || {};
  return {
    source: "youtube" as const,
    videoId,
    url,
    title: snippet.title || "",
    channel: snippet.channelTitle || "",
    description: snippet.description || "",
    thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
    publishedAt: snippet.publishedAt || "",
  };
}

export async function geminiJson(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini is not configured yet. Add GEMINI_API_KEY in Vercel.");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error("Gemini could not generate the song details. Check the API key or quota.");
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("");
  if (!text) throw new Error("Gemini returned no song details.");
  try {
    return JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
  } catch {
    throw new Error("Gemini returned an unreadable response. Please try again.");
  }
}
