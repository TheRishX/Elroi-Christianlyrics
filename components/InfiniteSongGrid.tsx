"use client";

import { useEffect, useRef, useState } from "react";
import { Song } from "@/lib/types";
import { SongCard } from "@/components/SongCard";

export function InfiniteSongGrid({
  songs,
  initialCount = 6,
  batchSize = 6,
}: {
  songs: Song[];
  initialCount?: number;
  batchSize?: number;
}) {
  const [visibleCount, setVisibleCount] = useState(
    Math.min(initialCount, songs.length),
  );
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(Math.min(initialCount, songs.length));
  }, [songs, initialCount]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= songs.length) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((count) => Math.min(count + batchSize, songs.length));
        }
      },
      { rootMargin: "480px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [batchSize, songs.length, visibleCount]);

  return (
    <>
      <div className="song-grid">
        {songs.slice(0, visibleCount).map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>
      {visibleCount < songs.length && (
        <div
          ref={sentinelRef}
          className="infinite-scroll-sentinel"
          role="status"
          aria-label="Loading more songs"
        >
          Loading more songs…
        </div>
      )}
    </>
  );
}
