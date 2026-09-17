"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Mic2,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Artist, LyricSection } from "@/lib/types";
import { UploadSong } from "@/lib/upload";
import { normalizeLyricText } from "@/lib/lyrics";

const blank: UploadSong = {
  title: "",
  romanTitle: "",
  alternateTitles: [],
  romanAlternateTitles: [],
  language: "hindi",
  artist: "",
  worshipTeam: "",
  composer: "",
  lyricist: "",
  album: "",
  releaseYear: "",
  songKey: "",
  tempo: "",
  youtubeUrl: "",
  audioUrl: "",
  excerpt: "",
  lastReviewedAt: "",
  genres: [],
  categories: [],
  themes: [],
  occasions: [],
  slug: "",
  lyrics: [],
  seo: { title: "", description: "" },
};
const choices = {
  genres: ["Worship", "Praise", "Gospel", "Contemporary", "Hymn"],
  categories: ["Worship", "Praise", "Prayer", "Christmas", "Easter"],
  themes: ["Jesus", "Faith", "Grace", "Hope", "Holy Spirit", "Salvation"],
  occasions: [
    "Sunday Service",
    "Prayer Meeting",
    "Christmas",
    "Easter",
    "Communion",
  ],
} as const;

function parseLyrics(original: string, roman: string): LyricSection[] {
  const parse = (value: string) => {
    const rows: { label: string; text: string }[] = [];
    let label = "Lyrics";
    let lines: string[] = [];
    const flush = () => {
      const text = lines.join("\n").trim();
      if (text) rows.push({ label, text });
      lines = [];
    };
    normalizeLyricText(value)
      .split("\n")
      .forEach((line) => {
        const tag = line.trim().match(/^\[([^\]\n]+)\]$/);
        if (tag) {
          flush();
          label = tag[1].trim() || "Lyrics";
        } else lines.push(line);
      });
    flush();
    return rows;
  };
  const native = parse(original),
    romanRows = parse(roman);
  return Array.from(
    { length: Math.max(native.length, romanRows.length) },
    (_, index) => ({
      label:
        native[index]?.label ||
        romanRows[index]?.label ||
        `Section ${index + 1}`,
      original: native[index]?.text || "",
      roman: romanRows[index]?.text || "",
    }),
  ).filter((section) => section.original || section.roman);
}
function splitTitles(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
function nativeLabel(language: UploadSong["language"]) {
  return language === "english"
    ? "English lyrics"
    : language === "nepali"
      ? "Nepali lyrics"
      : "Hindi lyrics";
}

export function ArtistPicker({
  values,
  onChange,
}: {
  values: string[];
  onChange: (names: string[], ids: number[]) => void;
}) {
  const [artists, setArtists] = useState<Artist[]>([]),
    [query, setQuery] = useState(""),
    [open, setOpen] = useState(false),
    [creating, setCreating] = useState(false),
    [newName, setNewName] = useState(""),
    [imageData, setImageData] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/upload/artists", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (active && Array.isArray(data.items)) setArtists(data.items);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const selected = new Set(values.map((value) => value.toLowerCase()));
  const idsFor = (names: string[]) =>
    names
      .map(
        (name) =>
          artists.find((item) => item.name.toLowerCase() === name.toLowerCase())
            ?.id || 0,
      )
      .filter(Boolean);
  const filtered = artists
    .filter(
      (artist) =>
        !selected.has(artist.name.toLowerCase()) &&
        artist.name.toLowerCase().includes(query.toLowerCase().trim()),
    )
    .slice(0, 6);
  function choose(artist: Artist) {
    if (selected.has(artist.name.toLowerCase())) return;
    const names = [...values, artist.name];
    onChange(names, idsFor(names));
    setQuery("");
    setOpen(false);
    setCreating(false);
  }
  function remove(name: string) {
    const names = values.filter(
      (value) => value.toLowerCase() !== name.toLowerCase(),
    );
    onChange(names, idsFor(names));
  }
  function readImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Profile images must be smaller than 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageData(String(reader.result || ""));
    reader.readAsDataURL(file);
  }
  async function createArtist() {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/upload/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ name, imageData }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || "Artist could not be created.");
      setArtists((current) => [
        ...current.filter((artist) => artist.id !== data.id),
        data,
      ]);
      const names = [...values, data.name];
      onChange(names, [...idsFor(values), data.id].filter(Boolean));
      setNewName("");
      setImageData("");
      setCreating(false);
      setQuery("");
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Artist could not be created.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="artist-picker">
      <div className="artist-selected-list">
        {values.map((name) => (
          <span className="artist-selected-chip" key={name}>
            {name}
            <button
              type="button"
              aria-label={`Remove ${name}`}
              onClick={() => remove(name)}
            >
              <X size={13} />
            </button>
          </span>
        ))}
      </div>
      <div className="artist-picker-input">
        <input
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            if (
              !values.length ||
              (values.length === 1 &&
                !artists.some(
                  (artist) =>
                    artist.name.toLowerCase() === values[0].toLowerCase(),
                ))
            )
              onChange(value ? [value] : [], []);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={
            values.length ? "Add another artist" : "Search or select artists"
          }
          autoComplete="off"
        />
        <Search size={16} />
      </div>
      {open && (
        <div className="artist-picker-menu">
          {loading && (
            <span className="artist-picker-hint">Loading artists…</span>
          )}
          {!loading &&
            filtered.map((artist) => (
              <button
                type="button"
                key={artist.id || artist.slug}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(artist)}
              >
                <span className="artist-picker-avatar">
                  {artist.image ? (
                    <img src={artist.image} alt="" />
                  ) : (
                    <Mic2 size={15} />
                  )}
                </span>
                {artist.name}
                <Plus size={14} />
              </button>
            ))}
          {!loading && !filtered.length && query.trim() && (
            <span className="artist-picker-hint">
              No artist named “{query.trim()}” yet.
            </span>
          )}
          <button
            type="button"
            className="artist-create-trigger"
            onClick={() => {
              setCreating(true);
              setNewName(query.trim());
            }}
          >
            + Create new artist
          </button>
          {creating && (
            <div className="artist-create-form">
              <strong>Create artist profile</strong>
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Artist or worship team name"
              />
              <label className="artist-image-input">
                Profile image{" "}
                <input type="file" accept="image/*" onChange={readImage} />
              </label>
              {imageData && (
                <img
                  className="artist-image-preview"
                  src={imageData}
                  alt="New profile preview"
                />
              )}
              {error && <span className="artist-picker-error">{error}</span>}
              <div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setCreating(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="title-check-button"
                  onClick={createArtist}
                  disabled={!newName.trim() || saving}
                >
                  {saving ? "Creating…" : "Create & select"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChoiceButtons({
  value,
  onChange,
}: {
  value: UploadSong["language"] | "publish" | "draft";
  onChange: (value: never) => void;
}) {
  const items =
    value === "publish" || value === "draft"
      ? [
          ["publish", "Publish now"],
          ["draft", "Save draft"],
        ]
      : [
          ["hindi", "Hindi"],
          ["english", "English"],
          ["nepali", "Nepali"],
        ];
  return (
    <div className="choice-buttons">
      {items.map(([key, label]) => (
        <button
          key={key}
          type="button"
          className={value === key ? "is-selected" : ""}
          onClick={() => onChange(key as never)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
function TagChoices({
  label,
  values,
  onChange,
  presets,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  presets: readonly string[];
}) {
  const [custom, setCustom] = useState("");
  const toggle = (item: string) =>
    onChange(
      values.includes(item)
        ? values.filter((value) => value !== item)
        : [...values, item],
    );
  const add = () => {
    const item = custom.trim();
    if (item && !values.includes(item)) onChange([...values, item]);
    setCustom("");
  };
  return (
    <div className="tag-group">
      <span className="field-name">{label}</span>
      <div className="tag-buttons">
        {presets.map((item) => (
          <button
            type="button"
            key={item}
            className={values.includes(item) ? "is-selected" : ""}
            onClick={() => toggle(item)}
          >
            {item}
          </button>
        ))}
        {values
          .filter((item) => !presets.includes(item as never))
          .map((item) => (
            <button
              type="button"
              key={item}
              className="is-selected custom-tag"
              onClick={() => toggle(item)}
            >
              {item}
              <X size={13} />
            </button>
          ))}
      </div>
      <div className="custom-tag-input">
        <input
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          placeholder={`Add ${label.toLowerCase()}`}
        />
        <button
          type="button"
          aria-label={`Add ${label.toLowerCase()}`}
          onClick={add}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

export function UploadPortal() {
  const [song, setSong] = useState<UploadSong>(blank),
    [nativeLyrics, setNativeLyrics] = useState(""),
    [romanLyrics, setRomanLyrics] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
      null,
    ),
    [matches, setMatches] = useState<import("@/lib/types").Song[] | null>(null),
    [exactMatch, setExactMatch] = useState(false),
    [pendingPublish, setPendingPublish] = useState<"publish" | "draft" | null>(
      null,
    ),
    [checkingTitle, setCheckingTitle] = useState(false),
    [checkError, setCheckError] = useState("");
  const sections = useMemo(
    () => parseLyrics(nativeLyrics, romanLyrics),
    [nativeLyrics, romanLyrics],
  );
  const update = <K extends keyof UploadSong>(field: K, value: UploadSong[K]) =>
    setSong((current) => ({ ...current, [field]: value }));
  async function checkTitle() {
    const title = song.title.trim();
    if (!title) return;
    setCheckingTitle(true);
    setCheckError("");
    setMatches(null);
    try {
      const response = await fetch("/api/upload/check-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, lyrics: sections }),
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          data.error || "Could not check the existing song library.",
        );
      setExactMatch(Boolean(data.exact));
      setMatches(data.items || []);
    } catch (error) {
      setCheckError(
        error instanceof Error
          ? error.message
          : "Could not check the existing song library.",
      );
      setExactMatch(false);
      setMatches([]);
    } finally {
      setCheckingTitle(false);
    }
  }
  async function publish(status: "publish" | "draft", confirmed = false) {
    setBusy(true);
    setMessage(null);
    try {
      if (!confirmed) {
        const response = await fetch("/api/upload/check-title", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: song.title.trim(), lyrics: sections }),
          cache: "no-store",
        });
        const check = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(check.error || "Could not verify duplicate songs.");
        if (check.items?.length) {
          setExactMatch(Boolean(check.exact));
          setMatches(check.items);
          setPendingPublish(status);
          return;
        }
      }
      const response = await fetch("/api/upload/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...song, lyrics: sections, status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || "WordPress could not publish this song.");
      setPendingPublish(null);
      setMatches(null);
      setSong(blank);
      setNativeLyrics("");
      setRomanLyrics("");
      setMessage({
        ok: true,
        text:
          status === "draft"
            ? "Draft saved in WordPress. Form cleared for the next song."
            : `Published successfully: ${data.url || data.slug || "song is live"}. Form cleared for the next song.`,
      });
    } catch (error) {
      setMessage({
        ok: false,
        text:
          error instanceof Error
            ? error.message
            : "Could not publish the song.",
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="upload-page manual-upload">
      <header className="upload-header">
        <div>
          <span className="eyebrow">ELROI TUNES / PUBLISHING</span>
          <h1>Publish a song</h1>
          <p>
            Paste final lyrics, choose the essentials, and publish directly to
            WordPress.
          </p>
        </div>
        <button
          className="upload-logout"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            window.location.reload();
          }}
        >
          Sign out
        </button>
      </header>
      {message && (
        <div
          className={`upload-message ${message.ok ? "success" : "failure"}`}
          role="status"
        >
          {message.ok && <CheckCircle2 size={18} />}
          {message.text}
        </div>
      )}
      <section className="manual-layout">
        <div className="manual-main">
          <section className="card form-card">
            <span className="eyebrow">01 / SONG</span>
            <div className="field-grid">
              <label>
                Song title *
                <div className="title-check-row">
                  <input
                    value={song.title}
                    onChange={(event) => {
                      update("title", event.target.value);
                      setMatches(null);
                      setExactMatch(false);
                      setPendingPublish(null);
                      setCheckError("");
                    }}
                    placeholder="e.g. Tumsa Koi Nahi"
                  />
                  <button
                    type="button"
                    className="title-check-button"
                    onClick={checkTitle}
                    disabled={!song.title.trim() || checkingTitle}
                  >
                    <Search size={16} />
                    {checkingTitle ? "Checking…" : "Check"}
                  </button>
                </div>
              </label>
              <label>
                Roman title
                <input
                  value={song.romanTitle || ""}
                  onChange={(event) => update("romanTitle", event.target.value)}
                  placeholder="Roman / Hinglish title"
                />
              </label>
              <label>
                Artist / singer *
                <ArtistPicker
                  values={
                    song.artists?.length
                      ? song.artists
                      : song.artist
                        ? [song.artist]
                        : []
                  }
                  onChange={(names, ids) =>
                    setSong((current) => ({
                      ...current,
                      artist: names[0] || "",
                      artists: names,
                      artistId: ids[0],
                      artistIds: ids,
                    }))
                  }
                />
              </label>
              <label>
                Worship team
                <input
                  value={song.worshipTeam || ""}
                  onChange={(event) =>
                    update("worshipTeam", event.target.value)
                  }
                  placeholder="Optional"
                />
              </label>
            </div>
            <label>
              Language *
              <ChoiceButtons
                value={song.language}
                onChange={(value) => update("language", value)}
              />
            </label>
            <label>
              URL slug{" "}
              <span className="optional">
                optional — WordPress can create it from the title
              </span>
              <input
                value={song.slug}
                onChange={(event) => update("slug", event.target.value)}
                placeholder="tumsa-koi-nahi"
              />
            </label>
          </section>
          <section className="card form-card lyrics-paste">
            <span className="eyebrow">02 / LYRICS</span>
            <p className="form-hint">
              Use tags like <code>[Verse 1]</code>, <code>[Chorus]</code> and{" "}
              <code>[Bridge]</code>. They are kept and highlighted on the song
              page.
            </p>
            <div className="lyrics-paste-grid">
              <label>
                {nativeLabel(song.language)} *
                <textarea
                  rows={15}
                  value={nativeLyrics}
                  onChange={(event) => setNativeLyrics(event.target.value)}
                  placeholder={"[Verse 1]\nPaste final lyrics here…"}
                />
              </label>
              {song.language !== "english" && (
                <label>
                  Roman lyrics <span className="optional">optional</span>
                  <textarea
                    rows={15}
                    value={romanLyrics}
                    onChange={(event) => setRomanLyrics(event.target.value)}
                    placeholder={
                      "[Verse 1]\nPaste matching Roman / Hinglish lyrics here…"
                    }
                  />
                </label>
              )}
            </div>
            <p className="section-count">
              {sections.length
                ? `${sections.length} lyric section${sections.length === 1 ? "" : "s"} ready`
                : "Add lyrics to create sections"}
            </p>
          </section>
          <section className="card form-card">
            <span className="eyebrow">03 / DISCOVERABILITY</span>
            <TagChoices
              label="Genres"
              values={song.genres || []}
              onChange={(values) => update("genres", values)}
              presets={choices.genres}
            />
            <TagChoices
              label="Categories"
              values={song.categories || []}
              onChange={(values) => update("categories", values)}
              presets={choices.categories}
            />
            <TagChoices
              label="Themes"
              values={song.themes || []}
              onChange={(values) => update("themes", values)}
              presets={choices.themes}
            />
            <TagChoices
              label="Occasions"
              values={song.occasions || []}
              onChange={(values) => update("occasions", values)}
              presets={choices.occasions}
            />
          </section>
        </div>
        <aside className="manual-side">
          <section className="card form-card">
            <span className="eyebrow">DETAILS</span>
            <div className="compact-fields">
              <label>
                Composer
                <input
                  value={song.composer || ""}
                  onChange={(event) => update("composer", event.target.value)}
                />
              </label>
              <label>
                Lyricist
                <input
                  value={song.lyricist || ""}
                  onChange={(event) => update("lyricist", event.target.value)}
                />
              </label>
              <label>
                Album
                <input
                  value={song.album || ""}
                  onChange={(event) => update("album", event.target.value)}
                />
              </label>
              <label>
                Release year
                <input
                  inputMode="numeric"
                  value={song.releaseYear || ""}
                  onChange={(event) =>
                    update("releaseYear", event.target.value)
                  }
                />
              </label>
              <label>
                Song key
                <input
                  value={song.songKey || ""}
                  onChange={(event) => update("songKey", event.target.value)}
                  placeholder="e.g. G"
                />
              </label>
              <label>
                Tempo (BPM)
                <input
                  inputMode="numeric"
                  value={song.tempo || ""}
                  onChange={(event) => update("tempo", event.target.value)}
                />
              </label>
            </div>
            <label>
              YouTube / YouTube Music URL
              <input
                type="url"
                value={song.youtubeUrl || ""}
                onChange={(event) => update("youtubeUrl", event.target.value)}
              />
            </label>
            <label>
              Audio URL
              <input
                type="url"
                value={song.audioUrl || ""}
                onChange={(event) => update("audioUrl", event.target.value)}
              />
            </label>
          </section>
          <section className="card form-card">
            <span className="eyebrow">SEARCH & NOTES</span>
            <label>
              Alternate titles{" "}
              <span className="optional">separate with commas</span>
              <input
                value={(song.alternateTitles || []).join(", ")}
                onChange={(event) =>
                  update("alternateTitles", splitTitles(event.target.value))
                }
              />
            </label>
            <label>
              Roman alternate titles{" "}
              <span className="optional">separate with commas</span>
              <input
                value={(song.romanAlternateTitles || []).join(", ")}
                onChange={(event) =>
                  update(
                    "romanAlternateTitles",
                    splitTitles(event.target.value),
                  )
                }
              />
            </label>
            <label>
              Short description
              <textarea
                rows={3}
                value={song.excerpt || ""}
                onChange={(event) => update("excerpt", event.target.value)}
              />
            </label>
            <label>
              SEO title
              <input
                value={song.seo?.title || ""}
                onChange={(event) =>
                  update("seo", { ...song.seo, title: event.target.value })
                }
              />
            </label>
            <label>
              SEO description
              <textarea
                rows={3}
                value={song.seo?.description || ""}
                onChange={(event) =>
                  update("seo", {
                    ...song.seo,
                    description: event.target.value,
                  })
                }
              />
            </label>
            <label>
              Last reviewed
              <input
                type="date"
                value={song.lastReviewedAt || ""}
                onChange={(event) =>
                  update("lastReviewedAt", event.target.value)
                }
              />
            </label>
          </section>
        </aside>
      </section>
      <footer className="upload-footer publish-dock">
        <div>
          <strong>Ready to send to WordPress?</strong>
          <p>
            Publishing creates or updates the matching slug and refreshes the
            main app.
          </p>
        </div>
        <div className="publish-actions">
          <button
            className="secondary-button"
            onClick={() => publish("draft")}
            disabled={busy || !song.title || !song.artist || !sections.length}
          >
            Save draft
          </button>
          <button
            className="publish-button"
            onClick={() => publish("publish")}
            disabled={busy || !song.title || !song.artist || !sections.length}
          >
            {busy ? "Publishing…" : "Publish to WordPress"}
          </button>
        </div>
      </footer>
      {matches && (
        <div
          className="match-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setMatches(null);
              setPendingPublish(null);
            }
          }}
        >
          <section
            className="match-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-match-title"
          >
            <button
              className="modal-close"
              type="button"
              aria-label="Close title matches"
              onClick={() => {
                setMatches(null);
                setPendingPublish(null);
              }}
            >
              <X size={18} />
            </button>
            <span className="eyebrow">
              {pendingPublish ? "DUPLICATE WARNING" : "TITLE CHECK"}
            </span>
            <h2 id="upload-match-title">
              {matches.length
                ? exactMatch
                  ? "This exact song was already uploaded"
                  : "Similar songs already uploaded"
                : "No similar songs found"}
            </h2>
            <p>
              {matches.length ? (
                <>
                  {exactMatch ? (
                    "Do not upload this song again. An exact title match already exists."
                  ) : (
                    <>
                      Review these similar songs before uploading{" "}
                      <strong>“{song.title.trim()}”</strong>.
                    </>
                  )}
                </>
              ) : (
                <>
                  Nothing in the current song library looks like{" "}
                  <strong>“{song.title.trim()}”</strong>.
                </>
              )}
              {checkError && <span className="upload-error">{checkError}</span>}
            </p>
            {matches.length > 0 && (
              <div className="match-list">
                {matches.map((match) => (
                  <a
                    className="match-item"
                    href={`/${match.language}/${match.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    key={`${match.id}-${match.slug}`}
                  >
                    <span>
                      <strong>{match.title}</strong>
                      {match.romanTitle && <small>{match.romanTitle}</small>}
                      <em>
                        {match.artist} · {match.language}
                      </em>
                    </span>
                    <span className="match-open">
                      <ExternalLink size={15} />
                    </span>
                  </a>
                ))}
              </div>
            )}
            <div className="match-modal-actions">
              <button
                type="button"
                className="manager-secondary"
                onClick={() => {
                  setMatches(null);
                  setPendingPublish(null);
                }}
              >
                Close
              </button>
              {pendingPublish && !exactMatch && (
                <button
                  type="button"
                  className="publish-button"
                  onClick={() => publish(pendingPublish, true)}
                  disabled={busy}
                >
                  {busy ? "Publishing…" : "Publish anyway"}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
