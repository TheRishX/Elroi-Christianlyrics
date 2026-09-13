"use client";
import { useEffect, useState } from "react";
import { Song } from "@/lib/types";
import { BookmarkButton } from "./BookmarkButton";
type Mode = "side" | "original" | "roman";
export function LyricReader({ song }: { song: Song }) {
  const hasRoman = song.language !== "english" && song.lyrics.some((section) => section.roman);
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
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        song.lyrics
          .map((l) =>
            [
              l.label,
              mode !== "roman" ? l.original : "",
              hasRoman && mode !== "original" ? l.roman || "" : "",
            ]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n\n"),
      );
      setNotice("Lyrics copied");
    } catch {
      setNotice("Copy unavailable. Select the lyrics to copy them.");
    }
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
                { id: "side", label: "Dual" },
                { id: "original", label: song.language === "hindi" ? "Hindi" : "Nepali" },
                { id: "roman", label: "English" },
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
          <button onClick={copy}>Copy</button>
          <button onClick={share}>Share</button>
          <BookmarkButton slug={song.slug} />
        </div>
      </div>
      <div className={`lyrics mode-${mode}`} style={{ fontSize: `${size}em` }}>
        {song.lyrics.map((section, i) => (
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
                  hidden={mode !== "roman"}
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
