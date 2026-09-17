import { LyricSection } from "./types";

/** UI normalization only. The persisted lyric model uses arrays of lines. */
export function normalizeLyricText(value: unknown): string {
  return String(value ?? "").replace(/\r\n?/g, "\n").normalize("NFC");
}

export function lyricLines(section: LyricSection, roman = false): string[] {
  const structured = roman ? section.romanLines : section.originalLines;
  if (Array.isArray(structured)) return structured.map((line) => normalizeLyricText(line));
  const legacy = roman ? section.roman : section.original;
  const text = normalizeLyricText(legacy);
  return text ? text.split("\n") : [];
}

export function lyricText(section: LyricSection, roman = false): string {
  return lyricLines(section, roman).join("\n");
}

export function lyricSearchText(section: LyricSection): string {
  return [...lyricLines(section), ...lyricLines(section, true)].join(" ");
}

/** Convert editor text into the canonical line based payload. */
export function textToLyricLines(value: unknown): string[] {
  const text = normalizeLyricText(value);
  if (!text) return [];
  return text.split("\n");
}
