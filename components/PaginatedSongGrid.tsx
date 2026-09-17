"use client";

import { useState, useEffect } from "react";
import { Song } from "@/lib/types";
import { SongCard } from "@/components/SongCard";

export function PaginatedSongGrid({
  songs,
  itemsPerPage = 12,
  homepage = false,
}: {
  songs: Song[];
  itemsPerPage?: number;
  homepage?: boolean;
}) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [songs]);

  const totalPages = Math.ceil(songs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleSongs = songs.slice(startIndex, startIndex + itemsPerPage);

  if (songs.length === 0) return null;

  // On homepage, we might just want to show the first page and not the pagination controls
  if (homepage) {
    return (
      <div className="song-grid homepage-song-grid">
        {songs.slice(0, itemsPerPage).map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="song-grid">
        {visibleSongs.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button 
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
