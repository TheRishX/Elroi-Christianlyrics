"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Song } from "@/lib/types";
import { SongCard } from "@/components/SongCard";
import { Icon } from "@/components/Icon";

const STORAGE_KEY = "songlight-bookmarks";

export function BookmarksList({ songs }: { songs: Song[] }) {
  const [saved, setSaved] = useState<Song[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(ids)) {
        const savedIds = new Set(ids.filter((id): id is string => typeof id === "string"));
        setSaved(songs.filter((song) => savedIds.has(song.slug)));
      }
    } finally {
      setReady(true);
    }
  }, [songs]);

  return (
    <div className="page results">
      <span className="eyebrow">CLOSE TO YOUR HEART</span>
      <h1>Your little songbook.</h1>
      <p className="muted">The songs you love, right where you left them.</p>
      {!ready ? (
        <p className="empty" role="status">Opening your songbook…</p>
      ) : saved.length ? (
        <div className="song-grid saved-grid">
          {saved.map((song) => <SongCard key={song.id} song={song} />)}
        </div>
      ) : (
        <div className="empty">
          <span className="empty-icon"><Icon name="bookmark" size={30} /></span>
          <h2>Make room for your favorites.</h2>
          <p>Tap the bookmark on any song to save it here.<br />A little collection, just for you.</p>
          <Link className="empty-cta" href="/browse">Find your first song <Icon name="arrow" size={18} /></Link>
        </div>
      )}
    </div>
  );
}
