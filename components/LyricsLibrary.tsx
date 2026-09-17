"use client";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Song } from "@/lib/types";
import { PaginatedSongGrid } from "@/components/PaginatedSongGrid";

function searchableText(song: Song) {
  return [
    song.title,
    song.romanTitle,
    song.artist,
    ...(song.artists || []),
    song.worshipTeam,
    ...(song.alternateTitles || []),
    ...(song.romanAlternateTitles || []),
    ...(song.lyrics || []).flatMap((section) => [
      section.original,
      section.roman,
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}

export function LyricsLibrary({
  songs,
  placeholder = "Search songs or lyrics…",
}: {
  songs: Song[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const visibleSongs = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return needle
      ? songs.filter((song) => searchableText(song).includes(needle))
      : songs;
  }, [songs, query]);
  return (
    <>
      <label className="directory-filter lyrics-filter">
        <Search size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
      </label>
      <PaginatedSongGrid songs={visibleSongs} />
      {!visibleSongs.length && (
        <p className="empty-artists">No songs or lyrics match your search.</p>
      )}
    </>
  );
}
