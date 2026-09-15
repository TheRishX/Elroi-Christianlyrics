"use client";
import {
  ChangeEvent,
  PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Artist, Song } from "@/lib/types";
import { ArtistPicker } from "@/components/UploadPortal";

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return (
    parts.length > 1
      ? parts[0][0] + parts.at(-1)![0]
      : parts[0]?.slice(0, 2) || "A"
  ).toUpperCase();
}
function readImage(
  event: ChangeEvent<HTMLInputElement>,
  setValue: (value: string) => void,
) {
  const file = event.target.files?.[0];
  if (!file || !file.type.startsWith("image/") || file.size > 8 * 1024 * 1024)
    return;
  const reader = new FileReader();
  reader.onload = () => setValue(String(reader.result || ""));
  reader.readAsDataURL(file);
}
function lyricText(song: Song) {
  return (song.lyrics || [])
    .map(
      (section) =>
        `[${section.label}]\n${section.original}${section.roman ? `\n--- Roman ---\n${section.roman}` : ""}`,
    )
    .join("\n\n");
}
function parseLyricText(value: string) {
  const chunks = value
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
  return chunks.map((chunk, index) => {
    const match = chunk.match(/^\[([^\]]+)\]\s*\n?([\s\S]*)$/);
    return {
      label: match?.[1]?.trim() || `Section ${index + 1}`,
      original: (match?.[2] || chunk).trim(),
    };
  });
}

export function UploadSettingsCenter() {
  const [logged, setLogged] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [tab, setTab] = useState<"artists" | "songs">("artists"),
    [artists, setArtists] = useState<Artist[]>([]),
    [songs, setSongs] = useState<Song[]>([]),
    [query, setQuery] = useState(""),
    [selectedArtist, setSelectedArtist] = useState<Artist | null>(null),
    [artistEditor, setArtistEditor] = useState(false),
    [artistName, setArtistName] = useState(""),
    [artistImage, setArtistImage] = useState(""),
    [cropSource, setCropSource] = useState(""),
    [cropZoom, setCropZoom] = useState(1),
    [cropOffset, setCropOffset] = useState({ x: 0, y: 0 }),
    [selectedSong, setSelectedSong] = useState<Song | null>(null),
    [songForm, setSongForm] = useState({
      title: "",
      artist: "",
      artists: "",
      artistIds: [] as number[],
      romanTitle: "",
      language: "english",
      excerpt: "",
      youtubeUrl: "",
      audioUrl: "",
      composer: "",
      lyricist: "",
      album: "",
      lyrics: "",
    }),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState("");
  const cropViewport = useRef<HTMLDivElement>(null),
    cropImage = useRef<HTMLImageElement>(null),
    dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  async function load() {
    const [artistResponse, songResponse] = await Promise.all([
      fetch("/api/upload/artists", { cache: "no-store" }),
      fetch("/api/upload/songs", { cache: "no-store" }),
    ]);
    const artistData = await artistResponse.json();
    const songData = await songResponse.json();
    setArtists(artistData.items || []);
    setSongs(songData.items || []);
  }
  useEffect(() => {
    fetch("/api/admin/session")
      .then((response) => response.json())
      .then(async (data) => {
        setLogged(data.authenticated);
        if (data.authenticated) await load();
      })
      .finally(() => setLoading(false));
  }, []);
  async function login() {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) return setMessage("Invalid email or password.");
    setLogged(true);
    await load();
  }
  const visibleArtists = useMemo(
    () =>
      artists.filter((artist) =>
        artist.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [artists, query],
  );
  const visibleSongs = useMemo(
    () =>
      songs.filter((song) =>
        `${song.title} ${song.artist}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [songs, query],
  );
  function editArtist(artist: Artist) {
    setSelectedArtist(artist.id ? artist : null);
    setArtistEditor(true);
    setArtistName(artist.name);
    setArtistImage("");
    setMessage("");
  }
  function chooseArtistImage(event: ChangeEvent<HTMLInputElement>) {
    readImage(event, (value) => {
      setCropSource(value);
      setCropZoom(1);
      setCropOffset({ x: 0, y: 0 });
    });
  }
  function moveCrop(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      setCropOffset({
        x: dragStart.current.offsetX + event.clientX - dragStart.current.x,
        y: dragStart.current.offsetY + event.clientY - dragStart.current.y,
      });
  }
  function startCrop(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: cropOffset.x,
      offsetY: cropOffset.y,
    };
  }
  function finishCrop() {
    const viewport = cropViewport.current,
      image = cropImage.current;
    if (!viewport || !image || !image.naturalWidth || !image.naturalHeight)
      return;
    const viewportSize = viewport.getBoundingClientRect().width,
      baseScale = Math.max(
        viewportSize / image.naturalWidth,
        viewportSize / image.naturalHeight,
      ),
      sourceSize = Math.min(
        image.naturalWidth,
        image.naturalHeight,
        viewportSize / (baseScale * cropZoom),
      ),
      centerX = image.naturalWidth / 2 - cropOffset.x / (baseScale * cropZoom),
      centerY = image.naturalHeight / 2 - cropOffset.y / (baseScale * cropZoom),
      sx = Math.max(
        0,
        Math.min(image.naturalWidth - sourceSize, centerX - sourceSize / 2),
      ),
      sy = Math.max(
        0,
        Math.min(image.naturalHeight - sourceSize, centerY - sourceSize / 2),
      );
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 900;
    canvas
      .getContext("2d")
      ?.drawImage(image, sx, sy, sourceSize, sourceSize, 0, 0, 900, 900);
    setArtistImage(canvas.toDataURL("image/jpeg", 0.9));
    setCropSource("");
  }
  async function saveArtist() {
    if (!artistName.trim()) return;
    setSaving(true);
    try {
      const method = selectedArtist ? "PATCH" : "POST";
      const response = await fetch("/api/upload/artists", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedArtist?.id,
          name: artistName,
          imageData: artistImage,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Artist could not be saved.");
      await load();
      setSelectedArtist(null);
      setArtistEditor(false);
      setArtistName("");
      setArtistImage("");
      setMessage("Artist profile saved.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Artist could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function removeArtistImage() {
    if (!selectedArtist) return;
    setSaving(true);
    try {
      const response = await fetch("/api/upload/artists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedArtist.id,
          name: selectedArtist.name,
          removeImage: true,
        }),
      });
      if (!response.ok) throw new Error("Profile image could not be removed.");
      await load();
      setSelectedArtist(null);
      setArtistEditor(false);
      setMessage("Profile image removed.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Profile image could not be removed.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function deleteArtist(artist: Artist) {
    if (
      !confirm(
        `Delete “${artist.name}” and remove this credit from all songs? This cannot be undone.`,
      )
    )
      return;
    setSaving(true);
    try {
      const target = artist.id
        ? `id=${artist.id}`
        : `name=${encodeURIComponent(artist.name)}`;
      const response = await fetch(`/api/upload/artists?${target}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || "Artist could not be deleted.");
      await load();
      setMessage(
        data.songsUpdated
          ? `Artist deleted and removed from ${data.songsUpdated} song${data.songsUpdated === 1 ? "" : "s"}.`
          : "Artist profile deleted.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Artist could not be deleted.",
      );
    } finally {
      setSaving(false);
    }
  }
  function editSong(song: Song) {
    setSelectedSong(song);
    setSongForm({
      title: song.title,
      artist: song.artist,
      artists: song.artists?.length ? song.artists.join(", ") : song.artist,
      artistIds: song.artistIds || [],
      romanTitle: song.romanTitle || "",
      language: song.language,
      excerpt: song.excerpt || "",
      youtubeUrl: song.youtubeUrl || "",
      audioUrl: song.audioUrl || "",
      composer: song.composer || "",
      lyricist: song.lyricist || "",
      album: song.album || "",
      lyrics: lyricText(song),
    });
    setMessage("");
  }
  async function saveSong() {
    if (!selectedSong || !songForm.title.trim() || !songForm.artist.trim())
      return;
    setSaving(true);
    try {
      const selectedArtists = songForm.artists
        .split(",")
        .map((artist) => artist.trim())
        .filter(Boolean);
      const response = await fetch("/api/upload/songs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...selectedSong,
          ...songForm,
          artist: selectedArtists[0] || "",
          artists: selectedArtists,
          artistIds: songForm.artistIds,
          id: selectedSong.id,
          slug: selectedSong.slug,
          lyrics: selectedSong.lyrics,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Song could not be updated.");
      await load();
      setSelectedSong(null);
      setMessage("Song updated.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Song could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function deleteSong(song: Song) {
    if (!confirm(`Permanently delete “${song.title}”?`)) return;
    const response = await fetch(`/api/upload/songs?id=${song.id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      await load();
      setMessage("Song deleted.");
    }
  }
  if (loading)
    return (
      <main className="uploads-center">
        <p className="muted">Loading management center…</p>
      </main>
    );
  if (!logged)
    return (
      <main className="uploads-center">
        <span className="eyebrow">ELROI TUNES / PRIVATE</span>
        <h1>Upload management</h1>
        <div className="uploads-login">
          <label>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
            />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
            />
          </label>
          <button className="admin-submit" onClick={login}>
            Sign in
          </button>
          {message && <p className="error">{message}</p>}
        </div>
      </main>
    );
  return (
    <main className="uploads-center">
      <header className="uploads-header">
        <div>
          <span className="eyebrow">PRIVATE WORKSPACE</span>
          <h1>Upload management</h1>
          <p>Manage artist profiles and update published songs.</p>
        </div>
        <a href="/upload" className="secondary-button">
          Open upload portal
        </a>
      </header>
      <nav className="uploads-tabs">
        <button
          className={tab === "artists" ? "active" : ""}
          onClick={() => {
            setTab("artists");
            setQuery("");
          }}
        >
          Artists
        </button>
        <button
          className={tab === "songs" ? "active" : ""}
          onClick={() => {
            setTab("songs");
            setQuery("");
          }}
        >
          Songs
        </button>
      </nav>
      {message && <p className="uploads-message">{message}</p>}
      <div className="uploads-toolbar">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            tab === "artists" ? "Search artists…" : "Search songs or artists…"
          }
        />
        <button
          className="admin-submit"
          onClick={() => {
            if (tab === "artists") {
              setSelectedArtist(null);
              setArtistName("");
              setArtistImage("");
              setArtistEditor(true);
            }
          }}
        >
          {" "}
          {tab === "artists" ? "+ Add artist" : "Manage songs"}
        </button>
      </div>
      {tab === "artists" ? (
        <section className="uploads-list">
          <div className="uploads-grid">
            {visibleArtists.map((artist) => (
              <article
                className="uploads-profile-card"
                key={artist.id || artist.slug}
              >
                <div className="uploads-avatar">
                  {artist.image ? (
                    <img src={artist.image} alt="" />
                  ) : (
                    initials(artist.name)
                  )}
                </div>
                <h2>{artist.name}</h2>
                <p>{artist.id ? "Artist profile" : "From song library"}</p>
                <div>
                  <button onClick={() => editArtist(artist)}>
                    {artist.id ? "Edit" : "Add profile"}
                  </button>
                  <button onClick={() => deleteArtist(artist)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
          {artistEditor && (
            <div
              className="uploads-modal-backdrop"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setArtistEditor(false);
                  setCropSource("");
                }
              }}
            >
              <div className="uploads-editor uploads-artist-modal" role="dialog" aria-modal="true" aria-labelledby="artist-editor-title">
              <div className="uploads-modal-heading">
                <div>
                  <span className="eyebrow">ARTIST PROFILE</span>
                  <h2 id="artist-editor-title">{selectedArtist ? "Edit artist" : "Add artist"}</h2>
                  <p>Set a name and optional profile image.</p>
                </div>
                <button type="button" className="uploads-modal-close" aria-label="Close artist form" onClick={() => { setArtistEditor(false); setCropSource(""); }}>×</button>
              </div>
              <input
                value={artistName}
                onChange={(event) => setArtistName(event.target.value)}
                placeholder="Artist or worship team name"
              />
              <label className="image-picker">
                <span>Profile image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={chooseArtistImage}
                />
                <strong>
                  {artistImage ? "Change image" : "Choose an image"}
                </strong>
                <small>Square crop · JPG, PNG or WebP up to 8 MB</small>
              </label>
              {artistImage && (
                <img
                  className="uploads-editor-preview"
                  src={artistImage}
                  alt="Preview"
                />
              )}
              {selectedArtist?.image && !artistImage && (
                <img
                  className="uploads-editor-preview"
                  src={selectedArtist.image}
                  alt="Current profile"
                />
              )}
              {cropSource && (
                <div className="crop-modal" role="dialog" aria-modal="true">
                  <div className="crop-dialog">
                    <div className="crop-dialog-head">
                      <div>
                        <span className="eyebrow">REFINE IMAGE</span>
                        <h3>Crop profile image</h3>
                      </div>
                      <button
                        type="button"
                        className="crop-close"
                        onClick={() => setCropSource("")}
                      >
                        ×
                      </button>
                    </div>
                    <div
                      ref={cropViewport}
                      className="crop-viewport"
                      onPointerDown={startCrop}
                      onPointerMove={moveCrop}
                      onPointerUp={(event) =>
                        event.currentTarget.releasePointerCapture(
                          event.pointerId,
                        )
                      }
                    >
                      <img
                        ref={cropImage}
                        src={cropSource}
                        alt="Crop preview"
                        style={{
                          transform: `translate(calc(-50% + ${cropOffset.x}px), calc(-50% + ${cropOffset.y}px)) scale(${cropZoom})`,
                        }}
                      />
                      <span className="crop-ring" />
                    </div>
                    <label className="crop-zoom">
                      Zoom
                      <input
                        type="range"
                        min="1"
                        max="2.5"
                        step=".01"
                        value={cropZoom}
                        onChange={(event) =>
                          setCropZoom(Number(event.target.value))
                        }
                      />
                    </label>
                    <p className="crop-hint">
                      Drag the image to position it inside the circle.
                    </p>
                    <div className="crop-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setCropSource("")}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="admin-submit"
                        onClick={finishCrop}
                      >
                        Apply crop
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setSelectedArtist(null);
                    setArtistEditor(false);
                    setArtistName("");
                  }}
                >
                  Cancel
                </button>
                {selectedArtist?.image && (
                  <button className="danger-button" onClick={removeArtistImage}>
                    Remove profile image
                  </button>
                )}
                <button
                  className="admin-submit"
                  onClick={saveArtist}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save artist"}
                </button>
              </div>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="uploads-list">
          <div className="uploads-song-list">
            {visibleSongs.map((song) => (
              <article key={song.id} className="uploads-song-row">
                <div>
                  <strong>{song.title}</strong>
                  <span>
                    {song.artist} · {song.language}
                  </span>
                </div>
                <button onClick={() => editSong(song)}>Edit</button>
                <button
                  className="danger-text"
                  onClick={() => deleteSong(song)}
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
          {selectedSong && (
            <div
              className="uploads-modal-backdrop"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setSelectedSong(null);
              }}
            >
            <div className="uploads-editor uploads-song-modal song-editor" role="dialog" aria-modal="true" aria-labelledby="song-editor-title">
              <div className="uploads-modal-heading">
                <div>
                  <span className="eyebrow">SONG DETAILS</span>
                  <h2 id="song-editor-title">Edit song</h2>
                  <p>Update the details without changing the lyrics.</p>
                </div>
                <button type="button" className="uploads-modal-close" aria-label="Close song form" onClick={() => setSelectedSong(null)}>×</button>
              </div>
              <div className="uploads-form-grid">
                <label>
                  Title
                  <input
                    value={songForm.title}
                    onChange={(event) =>
                      setSongForm({ ...songForm, title: event.target.value })
                    }
                  />
                </label>
              <label>
                Artists <span className="optional">search, select, or create</span>
                <ArtistPicker
                  values={songForm.artists.split(",").map((artist) => artist.trim()).filter(Boolean)}
                  onChange={(names, ids) =>
                    setSongForm({
                      ...songForm,
                      artists: names.join(", "),
                      artist: names[0] || "",
                      artistIds: ids,
                    })
                  }
                />
              </label>
                <label>
                  Roman title
                  <input
                    value={songForm.romanTitle}
                    onChange={(event) =>
                      setSongForm({
                        ...songForm,
                        romanTitle: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Language
                  <select
                    value={songForm.language}
                    onChange={(event) =>
                      setSongForm({ ...songForm, language: event.target.value })
                    }
                  >
                    <option value="hindi">Hindi</option>
                    <option value="nepali">Nepali</option>
                    <option value="english">English</option>
                  </select>
                </label>
                <label>
                  Composer
                  <input
                    value={songForm.composer}
                    onChange={(event) =>
                      setSongForm({ ...songForm, composer: event.target.value })
                    }
                  />
                </label>
                <label>
                  Lyricist
                  <input
                    value={songForm.lyricist}
                    onChange={(event) =>
                      setSongForm({ ...songForm, lyricist: event.target.value })
                    }
                  />
                </label>
                <label>
                  Album
                  <input
                    value={songForm.album}
                    onChange={(event) =>
                      setSongForm({ ...songForm, album: event.target.value })
                    }
                  />
                </label>
                <label>
                  YouTube URL
                  <input
                    value={songForm.youtubeUrl}
                    onChange={(event) =>
                      setSongForm({
                        ...songForm,
                        youtubeUrl: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <label>
                Short description
                <textarea
                  rows={3}
                  value={songForm.excerpt}
                  onChange={(event) =>
                    setSongForm({ ...songForm, excerpt: event.target.value })
                  }
                />
              </label>
              <p className="uploads-readonly-note">
                Lyrics are preserved during song updates. Edit SEO, artist, and
                song details here.
              </p>
              <div>
                <button
                  className="secondary-button"
                  onClick={() => setSelectedSong(null)}
                >
                  Cancel
                </button>
                <button
                  className="admin-submit"
                  onClick={saveSong}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save song"}
                </button>
              </div>
            </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
