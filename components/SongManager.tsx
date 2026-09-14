"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardPaste,
  History,
  ListTodo,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { Song } from "@/lib/types";

type TaskStatus = "planned" | "in-progress" | "ready" | "uploaded";
type Language = "hindi" | "nepali" | "english";
type Priority = "high" | "normal" | "low";
type Task = {
  id: number;
  title: string;
  language: Language;
  status: TaskStatus;
  priority: Priority;
  notes: string;
  createdAt: string;
  updatedAt?: string;
  uploadedSongId?: number | null;
  uploadedSongSlug?: string | null;
  uploadedAt?: string | null;
};
const STORAGE_KEY = "elroi-song-manager-v1";
const emptyForm = {
  title: "",
  language: "hindi" as Language,
  priority: "normal" as Priority,
  notes: "",
};
function key(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
function findUploaded(title: string, songs: Song[]) {
  const wanted = key(title);
  return songs.find((song) =>
    [
      song.title,
      song.romanTitle || "",
      ...(song.alternateTitles || []),
      ...(song.romanAlternateTitles || []),
    ].some((value) => key(value) === wanted),
  );
}
function possibleUploaded(title: string, songs: Song[]) {
  const wanted = key(title);
  if (!wanted) return [];
  const wantedWords = new Set(wanted.split(" "));
  return songs
    .map((song) => {
      const names = [
        song.title,
        song.romanTitle || "",
        ...(song.alternateTitles || []),
        ...(song.romanAlternateTitles || []),
      ]
        .map(key)
        .filter(Boolean);
      const score = Math.max(
        ...names.map((name) => {
          const words = new Set(name.split(" "));
          const overlap = [...wantedWords].filter((word) =>
            words.has(word),
          ).length;
          return (
            overlap / Math.max(wantedWords.size, words.size) +
            (name.includes(wanted) || wanted.includes(name) ? 0.45 : 0)
          );
        }),
      );
      return { song, score };
    })
    .filter((item) => item.score >= 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => item.song);
}
async function api(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Could not reach WordPress.");
  return data;
}

export function SongManager({ uploadedSongs }: { uploadedSongs: Song[] }) {
  const [tasks, setTasks] = useState<Task[]>([]),
    [form, setForm] = useState(emptyForm),
    [bulk, setBulk] = useState(""),
    [bulkLanguage, setBulkLanguage] = useState<Language>("hindi"),
    [query, setQuery] = useState(""),
    [tab, setTab] = useState<"plan" | "uploaded" | "history">("plan"),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [finishingTaskId, setFinishingTaskId] = useState<number | null>(null),
    [finishSongId, setFinishSongId] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState<{
      type: "warning" | "success";
      text: string;
    } | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api("/api/todo/tasks");
        if (!active) return;
        let loaded: Task[] = data.items || [];
        const raw = localStorage.getItem(STORAGE_KEY);
        let imported = 0,
          skipped = 0,
          alreadyUploaded = 0;
        if (raw && !localStorage.getItem(`${STORAGE_KEY}-migrated`)) {
          const old = JSON.parse(raw);
          if (Array.isArray(old)) {
            for (const item of old) {
              const title = String(item.title || "").trim();
              if (!title) continue;
              if (findUploaded(title, uploadedSongs)) {
                alreadyUploaded++;
                continue;
              }
              try {
                const created = await api("/api/todo/tasks", {
                  method: "POST",
                  body: JSON.stringify({
                    title,
                    language: item.language || "hindi",
                    priority: item.priority || "normal",
                    notes: item.notes || "",
                    status: item.status || "planned",
                  }),
                });
                loaded = [created, ...loaded];
                imported++;
              } catch (e) {
                if (String(e).toLowerCase().includes("already")) skipped++;
                else throw e;
              }
            }
            localStorage.setItem(`${STORAGE_KEY}-migrated`, "1");
            if (imported || skipped || alreadyUploaded)
              setMessage({
                type: "success",
                text: `Migration complete: ${imported} imported · ${skipped} duplicates skipped · ${alreadyUploaded} already uploaded.`,
              });
          }
        }
        setTasks(loaded);
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Could not load tasks.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [uploadedSongs]);
  useEffect(() => {
    if (loading) return;
    tasks
      .filter((task) => task.status !== "uploaded")
      .forEach(async (task) => {
        const match = findUploaded(task.title, uploadedSongs);
        if (!match) return;
        try {
          const updated = await api(`/api/todo/tasks/${task.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              status: "uploaded",
              uploadedSongId: match.id,
              uploadedSongSlug: match.slug,
              uploadedAt: match.updatedAt || new Date().toISOString(),
            }),
          });
          setTasks((current) =>
            current.map((item) => (item.id === task.id ? updated : item)),
          );
        } catch {}
      });
  }, [loading, tasks, uploadedSongs]);
  const uploadedKeys = useMemo(
    () =>
      new Set(
        uploadedSongs.flatMap((song) =>
          [
            song.title,
            song.romanTitle || "",
            ...(song.alternateTitles || []),
            ...(song.romanAlternateTitles || []),
          ]
            .map(key)
            .filter(Boolean),
        ),
      ),
    [uploadedSongs],
  );
  const taskKeys = useMemo(
    () => new Set(tasks.map((task) => key(task.title))),
    [tasks],
  );
  const visibleTasks = tasks.filter(
      (task) =>
        task.status !== "uploaded" && key(task.title).includes(key(query)),
    ),
    history = tasks.filter(
      (task) =>
        task.status === "uploaded" && key(task.title).includes(key(query)),
    ),
    visibleUploaded = uploadedSongs.filter((song) =>
      key(`${song.title} ${song.artist}`).includes(key(query)),
    );
  const readyCount = tasks.filter((task) => task.status === "ready").length;
  async function addTask(event: FormEvent) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) return;
    if (uploadedKeys.has(key(title)))
      return setMessage({
        type: "warning",
        text: `Already uploaded: “${title}”.`,
      });
    if (taskKeys.has(key(title)))
      return setMessage({
        type: "warning",
        text: `Already on your upcoming list: “${title}”.`,
      });
    const similar = possibleUploaded(title, uploadedSongs)[0];
    if (similar)
      setMessage({
        type: "warning",
        text: `Possible existing lyric: “${similar.title}”. Review it before publishing a duplicate.`,
      });
    setSaving(true);
    try {
      const created = await api("/api/todo/tasks", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setTasks((current) => [created, ...current]);
      setForm(emptyForm);
      setMessage({ type: "success", text: "Added to your upcoming songs." });
    } catch (e) {
      setMessage({
        type: "warning",
        text: e instanceof Error ? e.message : "Could not save task.",
      });
    } finally {
      setSaving(false);
    }
  }
  async function importBulk() {
    const titles = bulk
        .split(/\r?\n/)
        .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
        .filter(Boolean),
      uploaded: string[] = [],
      duplicates: string[] = [],
      additions: Task[] = [],
      seen = new Set([...uploadedKeys, ...taskKeys]);
    setSaving(true);
    try {
      for (const title of titles) {
        const titleKey = key(title);
        if (uploadedKeys.has(titleKey)) {
          uploaded.push(title);
          continue;
        }
        if (seen.has(titleKey)) {
          duplicates.push(title);
          continue;
        }
        const created = await api("/api/todo/tasks", {
          method: "POST",
          body: JSON.stringify({
            title,
            language: bulkLanguage,
            priority: "normal",
            notes: "",
            status: "planned",
          }),
        });
        additions.push(created);
        seen.add(titleKey);
      }
      setTasks((current) => [...additions, ...current]);
      setBulk("");
      setMessage({
        type: additions.length ? "success" : "warning",
        text: `${additions.length} added${uploaded.length ? ` · ${uploaded.length} already uploaded` : ""}${duplicates.length ? ` · ${duplicates.length} already planned` : ""}.`,
      });
    } catch (e) {
      setMessage({
        type: "warning",
        text: e instanceof Error ? e.message : "Bulk import failed.",
      });
    } finally {
      setSaving(false);
    }
  }
  async function updateTask(id: number, patch: Partial<Task>) {
    try {
      const updated = await api(`/api/todo/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setTasks((current) =>
        current.map((task) => (task.id === id ? updated : task)),
      );
      return true;
    } catch (e) {
      setMessage({
        type: "warning",
        text: e instanceof Error ? e.message : "Could not update task.",
      });
      return false;
    }
  }
  async function renameTask(id: number, title: string) {
    const clean = title.trim();
    if (!clean) return;
    if (
      tasks.some((task) => task.id !== id && key(task.title) === key(clean))
    ) {
      setMessage({
        type: "warning",
        text: `Another task already uses “${clean}”.`,
      });
      return;
    }
    await updateTask(id, { title: clean });
  }
  async function removeTask(id: number) {
    try {
      await api(`/api/todo/tasks/${id}`, { method: "DELETE" });
      setTasks((current) => current.filter((task) => task.id !== id));
    } catch (e) {
      setMessage({
        type: "warning",
        text: e instanceof Error ? e.message : "Could not delete task.",
      });
    }
  }
  function chooseStatus(id: number, status: string) {
    if (status === "uploaded") {
      const task = tasks.find((item) => item.id === id);
      const exact = task ? findUploaded(task.title, uploadedSongs) : undefined;
      setFinishingTaskId(id);
      setFinishSongId(exact ? String(exact.id) : "");
      return;
    }
    updateTask(id, { status: status as TaskStatus });
  }
  async function finishTask() {
    if (!finishingTaskId || !finishSongId) return;
    const song = uploadedSongs.find((item) => String(item.id) === finishSongId);
    if (!song) return;
    const saved = await updateTask(finishingTaskId, {
      status: "uploaded",
      uploadedSongId: song.id,
      uploadedSongSlug: song.slug,
      uploadedAt: song.updatedAt || new Date().toISOString(),
    });
    if (!saved) return;
    setFinishingTaskId(null);
    setFinishSongId("");
    setMessage({
      type: "success",
      text: `Linked “${song.title}” and marked the task finished.`,
    });
  }
  const languages = [
      ["hindi", "Hindi"],
      ["nepali", "Nepali"],
      ["english", "English"],
    ] as const,
    priorities = [
      ["high", "High"],
      ["normal", "Normal"],
      ["low", "Low"],
    ] as const,
    statuses = [
      ["planned", "Planned"],
      ["in-progress", "In progress"],
      ["uploaded", "Finished"],
    ] as const;
  const choices = (
    selected: string,
    values: readonly (readonly [string, string])[],
    onChange: (value: any) => void,
    className = "choice-buttons",
  ) => (
    <div className={className} role="group">
      {values.map(([value, label]) => (
        <button
          type="button"
          key={value}
          className={selected === value ? "active" : ""}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
  return (
    <div className="page song-manager">
      <section className="manager-hero">
        <div>
          <span className="eyebrow">YOUR LYRICS CONTROL ROOM</span>
          <h1>Keep every song moving.</h1>
          <p>
            Track what is live, what is next, and what still needs your
            attention.
          </p>
        </div>
        <div className="manager-hero-icon">
          <ListTodo size={42} strokeWidth={1.4} />
        </div>
      </section>
      <section className="manager-stats">
        <div>
          <span>Uploaded</span>
          <strong>{uploadedSongs.length}</strong>
          <small>Synced from your library</small>
        </div>
        <div>
          <span>Upcoming</span>
          <strong>
            {tasks.filter((task) => task.status !== "uploaded").length}
          </strong>
          <small>Titles in your pipeline</small>
        </div>
        <div>
          <span>Ready to publish</span>
          <strong>{readyCount}</strong>
          <small>Prepared for WordPress</small>
        </div>
      </section>
      <div className="manager-toolbar">
        <div className="manager-tabs">
          <button
            className={tab === "plan" ? "active" : ""}
            onClick={() => setTab("plan")}
          >
            <ListTodo size={16} /> Upcoming
          </button>
          <button
            className={tab === "uploaded" ? "active" : ""}
            onClick={() => setTab("uploaded")}
          >
            <CheckCircle2 size={16} /> Uploaded
          </button>
          <button
            className={tab === "history" ? "active" : ""}
            onClick={() => setTab("history")}
          >
            <History size={16} /> History
          </button>
        </div>
        <label className="manager-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a song"
          />
        </label>
      </div>
      {message && (
        <div className={`manager-message ${message.type}`} role="status">
          {message.type === "warning" ? (
            <AlertTriangle size={17} />
          ) : (
            <CheckCircle2 size={17} />
          )}
          {message.text}
          <button onClick={() => setMessage(null)} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}
      {error && (
        <div className="manager-message warning">
          <AlertTriangle size={17} />
          {error}
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}
      {loading ? (
        <div className="manager-empty">
          <ListTodo size={25} />
          <h3>Loading your WordPress pipeline…</h3>
          <p>Syncing shared song tasks.</p>
        </div>
      ) : tab === "plan" ? (
        <>
          <section className="manager-add-grid">
            <form className="manager-card add-song-card" onSubmit={addTask}>
              <div className="card-kicker">
                <Plus size={16} /> Add one song
              </div>
              <h2>Plan your next upload.</h2>
              <p>
                We will warn you if this title already exists in your live
                library.
              </p>
              <div className="manager-form-row">
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Song title"
                  aria-label="Song title"
                />
                {choices(form.language, languages, (value) =>
                  setForm({ ...form, language: value }),
                )}
              </div>
              {choices(
                form.priority,
                priorities,
                (value) => setForm({ ...form, priority: value }),
                "choice-buttons priority-buttons",
              )}
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional note: find Roman lyrics, confirm artist…"
                aria-label="Note"
                rows={2}
              />
              <button
                className="manager-primary"
                type="submit"
                disabled={saving}
              >
                Add to upcoming <Plus size={17} />
              </button>
            </form>
            <div className="manager-card bulk-card">
              <div className="card-kicker">
                <ClipboardPaste size={16} /> Paste a batch
              </div>
              <h2>Build your pipeline quickly.</h2>
              <p>Choose a language, then add one title per line.</p>
              {choices(
                bulkLanguage,
                languages,
                setBulkLanguage,
                "bulk-language",
              )}
              <textarea
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
                placeholder={"Yeshu Tera Naam\nPrabhu Ko Mahima\nAmazing Grace"}
                rows={6}
                aria-label="Upcoming song titles"
              />
              <button
                className="manager-secondary"
                onClick={importBulk}
                disabled={!bulk.trim() || saving}
              >
                Add list to upcoming <ClipboardPaste size={16} />
              </button>
            </div>
          </section>
          <section className="manager-list-section">
            <div className="manager-section-head">
              <div>
                <span className="eyebrow">UPLOAD PIPELINE</span>
                <h2>
                  Upcoming songs <span>{visibleTasks.length}</span>
                </h2>
              </div>
              <span className="manager-hint">Saved securely in WordPress</span>
            </div>
            {visibleTasks.length ? (
              <div className="task-list">
                {visibleTasks.map((task) => (
                  <article className="task-row" key={task.id}>
                    <div className={`task-priority ${task.priority}`} />
                    <div className="task-main">
                      <input
                        className="task-title-input"
                        defaultValue={task.title}
                        onBlur={(e) => {
                          if (
                            e.target.value.trim() &&
                            e.target.value.trim() !== task.title
                          )
                            renameTask(task.id, e.target.value);
                        }}
                        aria-label={`Edit ${task.title}`}
                      />
                      <div className="task-meta">
                        <span className={`task-language ${task.language}`}>
                          {task.language}
                        </span>
                        {task.notes && <span>{task.notes}</span>}
                      </div>
                    </div>
                    {choices(
                      task.status,
                      statuses,
                      (value) => chooseStatus(task.id, value),
                      "task-status-buttons",
                    )}
                    {finishingTaskId === task.id && (
                      <div className="finish-picker">
                        <label htmlFor={`finish-song-${task.id}`}>
                          Link the published lyric before finishing
                        </label>
                        <select
                          id={`finish-song-${task.id}`}
                          value={finishSongId}
                          onChange={(event) =>
                            setFinishSongId(event.target.value)
                          }
                        >
                          <option value="">Choose uploaded song…</option>
                          {possibleUploaded(task.title, uploadedSongs).map(
                            (song) => (
                              <option value={song.id} key={song.id}>
                                {song.title} · {song.language}
                              </option>
                            ),
                          )}
                          <optgroup label="All published lyrics">
                            {uploadedSongs
                              .filter(
                                (song) =>
                                  !possibleUploaded(
                                    task.title,
                                    uploadedSongs,
                                  ).some((match) => match.id === song.id),
                              )
                              .map((song) => (
                                <option value={song.id} key={song.id}>
                                  {song.title} · {song.language}
                                </option>
                              ))}
                          </optgroup>
                        </select>
                        <div className="finish-picker-actions">
                          <button
                            type="button"
                            onClick={finishTask}
                            disabled={!finishSongId}
                          >
                            Confirm finished
                          </button>
                          <button
                            type="button"
                            onClick={() => setFinishingTaskId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    <button
                      className="task-delete"
                      onClick={() => removeTask(task.id)}
                      aria-label={`Remove ${task.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="manager-empty">
                <ListTodo size={25} />
                <h3>Your upload pipeline is clear.</h3>
                <p>
                  Add a title above or paste your next batch to get started.
                </p>
              </div>
            )}
          </section>
        </>
      ) : tab === "uploaded" ? (
        <section className="manager-list-section">
          <div className="manager-section-head">
            <div>
              <span className="eyebrow">LIVE LIBRARY</span>
              <h2>
                Uploaded songs <span>{visibleUploaded.length}</span>
              </h2>
            </div>
            <span className="manager-hint">
              Automatically synced from WordPress
            </span>
          </div>
          {visibleUploaded.length ? (
            <div className="uploaded-list">
              {visibleUploaded.map((song) => (
                <Link
                  href={`/${song.language}/${song.slug}`}
                  className="uploaded-row"
                  key={song.id}
                >
                  <div className="uploaded-icon">
                    <Upload size={17} />
                  </div>
                  <div>
                    <strong>{song.title}</strong>
                    <span>{song.artist || "Artist not added"}</span>
                  </div>
                  <time>
                    {song.updatedAt
                      ? new Date(song.updatedAt).toLocaleDateString()
                      : "Published"}
                  </time>
                </Link>
              ))}
            </div>
          ) : (
            <div className="manager-empty">
              <Search size={25} />
              <h3>No matching songs.</h3>
              <p>Try another title or artist.</p>
            </div>
          )}
        </section>
      ) : (
        <section className="manager-list-section">
          <div className="manager-section-head">
            <div>
              <span className="eyebrow">UPLOAD HISTORY</span>
              <h2>
                Completed tasks <span>{history.length}</span>
              </h2>
            </div>
            <span className="manager-hint">
              Tasks remain available for traceability
            </span>
          </div>
          {history.length ? (
            <div className="uploaded-list">
              {history.map((task) => (
                <div className="uploaded-row" key={task.id}>
                  <div className="uploaded-icon">
                    <CheckCircle2 size={17} />
                  </div>
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.language} · uploaded</span>
                  </div>
                  {task.uploadedSongSlug ? (
                    <Link href={`/${task.language}/${task.uploadedSongSlug}`}>
                      View lyrics
                    </Link>
                  ) : (
                    <span>Matched</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="manager-empty">
              <History size={25} />
              <h3>No completed tasks yet.</h3>
              <p>Matched songs will stay here as upload history.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
