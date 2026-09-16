"use client";

import { useEffect, useRef, useState } from "react";
import { Song } from "@/lib/types";
import { SongCard } from "@/components/SongCard";

export function InfiniteSongGrid({
  songs,
  initialCount = 6,
  batchSize = 6,
  homepage = false,
}: {
  songs: Song[];
  initialCount?: number;
  batchSize?: number;
  homepage?: boolean;
}) {
  const [visibleCount, setVisibleCount] = useState(
    Math.min(initialCount, songs.length),
  );
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(Math.min(initialCount, songs.length));
  }, [songs, initialCount]);

  useEffect(() => {
    if (homepage) return;
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
  }, [batchSize, homepage, songs.length, visibleCount]);

  return (
    <>
      <div className={`song-grid${homepage ? " homepage-song-grid" : ""}`}>
        {songs.slice(0, visibleCount).map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>
      {!homepage && visibleCount < songs.length && (
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
