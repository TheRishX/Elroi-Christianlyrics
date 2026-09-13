"use client";
import { useEffect, useState } from "react";
import { Song } from "@/lib/types";
import { BookmarkButton } from "./BookmarkButton";
type Mode = "side" | "original" | "roman";
type DisplaySection = { label: string; original: string; roman?: string };

function cleanLegacy(value: string, roman = false) {
  return value
    .replace(/\\r\\n|\\n|\\r/g, "\n")
    .replace(roman ? /[?�]?n(?=[A-Z])/g : /[?�]?n(?=[\u0900-\u097fA-Z])/g, "\n");
}

function splitSections(value: string, fallback: string): DisplaySection[] {
  const text = cleanLegacy(value).trim();
  if (!text) return [];
  const heading = /(?:^|\n)\s*(Verse|Chorus|Bridge|Ending|Refrain|Intro|Outro|वर्स|वार्स|कोरस|ब्रिज|एंडिंग|रिफ्रेन|इंट्रो|आउट्रो)(?:\s+(\d+))?\s*:?\s*(?:\n|$)/giu;
  const matches = [...text.matchAll(heading)];
  const label = (raw: string, number?: string) => {
    const key = raw.toLocaleLowerCase();
    const english = /verse|वर्स|वार्स/.test(key) ? "Verse" : /chorus|कोरस/.test(key) ? "Chorus" : /bridge|ब्रिज/.test(key) ? "Bridge" : /ending|एंडिंग/.test(key) ? "Ending" : /refrain|रिफ्रेन/.test(key) ? "Refrain" : /intro|इंट्रो/.test(key) ? "Intro" : "Outro";
    return `${english}${number ? ` ${number}` : ""}`;
  };
  if (!matches.length) return [{ label: fallback, original: text }];
  const result: DisplaySection[] = [];
  const firstIndex = matches[0].index ?? 0;
  if (firstIndex > 0) result.push({ label: fallback, original: text.slice(0, firstIndex).trim() });
  matches.forEach((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index ?? text.length : text.length;
    result.push({ label: label(match[1], match[2]), original: text.slice(start, end).trim() });
  });
  return result.filter((section) => section.original);
}

function getDisplaySections(song: Song): DisplaySection[] {
  const original: DisplaySection[] = [];
  const roman: DisplaySection[] = [];
  song.lyrics.forEach((section) => {
    original.push(...splitSections(section.original, section.label));
    if (section.roman) roman.push(...splitSections(cleanLegacy(section.roman, true), section.label));
  });
  return original.map((section, index) => ({ ...section, roman: roman[index]?.original || song.lyrics[index]?.roman || "" }));
}

export function LyricReader({ song }: { song: Song }) {
  const displaySections = getDisplaySections(song);
  const hasRoman = song.language !== "english" && displaySections.some((section) => section.roman);
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
                { id: "original", label: song.language === "hindi" ? "हिन्दी" : "नेपाली" },
                { id: "roman", label: song.language === "hindi" ? "Hindi" : "Nepali" },
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
