"use client";
import { useEffect, useState } from "react";
import { Song } from "@/lib/types";
import { BookmarkButton } from "./BookmarkButton";
type Mode = "side" | "original" | "roman";
type DisplaySection = { label: string; original: string; roman?: string };

const HEADING = /(?:^|\n)\s*\[([^\]\n]+)\]\s*(?:\n|$)/gu;

function normalizeLabel(raw: string) {
  return raw.trim().replace(/\s+/g, " ");
}

function cleanLegacy(value: string, roman = false) {
  // Keep the lyric payload byte-for-byte readable. Older WordPress records
  // sometimes contain the literal characters "\\n"; decode only those
  // escape sequences. Never treat a normal Latin `n` as a newline: doing so
  // can split or delete valid lyric text next to Devanagari.
  return value
    .replace(/\uFFFD/g, "")
    .replace(/\\r\\n|\\n|\\r/g, "\n")
    .normalize("NFC");
}

function repairDevanagariLine(value: string, roman = "") {
  const text = value.trimStart();
  if (!text) return value;

  // A combining Devanagari mark without its base renders as the dotted
  // circle seen in the reader. The source has lost its leading अ; restore
  // that base rather than exposing a broken glyph.
  const first = Array.from(text)[0];
  if (first && /\p{Mark}/u.test(first)) return `${value.slice(0, value.length - text.length)}अ${text}`;

  // When the native line begins with ब but the preserved Roman line begins
  // with "Ab", the initial अ was dropped upstream. Use the Roman counterpart
  // only for this unambiguous one-character repair.
  if (/^ab(?:\s|$)/iu.test(roman.trim()) && /^ब(?:\s|$)/u.test(text))
    return `${value.slice(0, value.length - text.length)}अ${text}`;
  return value;
}

function repairDevanagari(value: string, roman = "") {
  const nativeLines = value.split("\n");
  const romanLines = roman.split("\n");
  return nativeLines
    .map((line, index) => repairDevanagariLine(line, romanLines[index] || ""))
    .join("\n");
}

function alignNativeSections(
  native: DisplaySection[],
  roman: DisplaySection[],
): DisplaySection[] {
  // WordPress can store all native lyrics in one block while the Roman
  // version contains explicit Verse/Chorus headings. Use the Roman section
  // line counts to keep every stanza visible instead of mapping only index 0.
  if (native.length !== 1 || roman.length <= 1) return native;
  const lines = native[0].original.split("\n");
  let offset = 0;
  return roman.map((section) => {
    const count = Math.max(1, section.original.split("\n").length);
    const original = lines.slice(offset, offset + count).join("\n").trim();
    offset += count;
    return { label: section.label, original };
  }).filter((section) => section.original);
}

function splitSections(value: string, fallback: string): DisplaySection[] {
  const text = cleanLegacy(value).trim();
  if (!text) return [];
  HEADING.lastIndex = 0;
  const matches = [...text.matchAll(HEADING)];
  const fallbackLabel = fallback;
  if (!matches.length) return [{ label: fallbackLabel, original: text }];
  const result: DisplaySection[] = [];
  const firstIndex = matches[0].index ?? 0;
  if (firstIndex > 0)
    result.push({
      label: fallbackLabel,
      original: text.slice(0, firstIndex).trim(),
    });
  matches.forEach((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end =
      index + 1 < matches.length
        ? (matches[index + 1].index ?? text.length)
        : text.length;
    result.push({
      label: normalizeLabel(match[1]),
      original: text.slice(start, end).trim(),
    });
  });
  return result.filter((section) => section.original);
}

function getDisplaySections(song: Song): DisplaySection[] {
  const original: DisplaySection[] = [];
  const roman: DisplaySection[] = [];
  song.lyrics.forEach((section) => {
    const preservedRoman = cleanLegacy(section.roman || "", true);
    original.push(...splitSections(repairDevanagari(cleanLegacy(section.original), preservedRoman), section.label));
    if (section.roman)
      roman.push(...splitSections(preservedRoman, section.label));
  });
  const alignedOriginal = alignNativeSections(original, roman);
  return alignedOriginal.map((section, index) => ({
    ...section,
    roman: roman[index]?.original || "",
  }));
}

export function LyricReader({ song }: { song: Song }) {
  const displaySections = getDisplaySections(song);
  const hasRoman =
    song.language !== "english" &&
    displaySections.some((section) => section.roman);
  const [mode, setMode] = useState<Mode>("original");
  const [size, setSize] = useState(1);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try {
      const value = Number(localStorage.getItem("songlight-font-size") || 1);
      if (Number.isFinite(value)) setSize(Math.min(1.5, Math.max(0.85, value)));
      const saved = localStorage.getItem("songlight-reader-mode");
      if (hasRoman && ["side", "original", "roman"].includes(saved || ""))
        setMode(saved as Mode);
    } catch {}
  }, [hasRoman]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(timeout);
  }, [notice]);
  function select(next: Mode) {
    setMode(next);
    try {
      localStorage.setItem("songlight-reader-mode", next);
    } catch {}
  }
  function resize(delta: number) {
    const next =
      Math.round(Math.min(1.5, Math.max(0.85, size + delta)) * 100) / 100;
    setSize(next);
    try {
      localStorage.setItem("songlight-font-size", String(next));
    } catch {}
  }
  async function share() {
    try {
      if (navigator.share)
        await navigator.share({ title: song.title, url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        setNotice("Song link copied");
      }
    } catch {}
  }
  return (
    <section className="reader" aria-label="Lyric reader">
      <div className="reader-toolbar">
        {hasRoman && (
          <div className="mode-toggle" role="group" aria-label="Lyric display">
            {(
              [
                {
                  id: "original",
                  label:
                    song.language === "hindi"
                      ? "Hindi Lyrics"
                      : "Nepali Lyrics",
                },
                { id: "roman", label: "English Lyrics" },
                { id: "side", label: "Both" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                aria-pressed={mode === m.id}
                className={mode === m.id ? "active" : ""}
                onClick={() => select(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
        <div className="reader-actions">
          <button
            onClick={() => resize(-0.1)}
            disabled={size <= 0.85}
            aria-label="Decrease font size"
          >
            A−
          </button>
          <button
            onClick={() => resize(0.1)}
            disabled={size >= 1.5}
            aria-label="Increase font size"
          >
            A+
          </button>
          <button onClick={share}>Share</button>
          <BookmarkButton slug={song.slug} />
        </div>
      </div>
      <div className={`lyrics mode-${mode}`} style={{ fontSize: `${size}em` }}>
        {displaySections.map((section, i) => (
          <div className="lyric-section" key={i}>
            <h3>{section.label}</h3>
            <div className="lyric-columns">
              <p
                className="original"
                hidden={mode === "roman"}
                lang={
                  song.language === "hindi"
                    ? "hi"
                    : song.language === "nepali"
                      ? "ne"
                      : "en"
                }
              >
                {section.original}
              </p>
              {hasRoman && (
                <p
                  className="roman"
                  hidden={mode === "original"}
                  lang={song.language === "hindi" ? "hi-Latn" : "ne-Latn"}
                >
                  {section.roman}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className={notice ? "reader-notice" : "sr-only"} role="status">
        {notice}
      </div>
    </section>
  );
}
