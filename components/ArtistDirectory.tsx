"use client";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Artist, Song } from "@/lib/types";
import { artistInitials, artistSlug } from "@/lib/artists";

function artistNames(songs: Song[], artists: Artist[]) {
  return Array.from(
    new Set(
      [
        ...artists.map((artist) => artist.name),
        ...songs.flatMap((song) => [
          song.artist,
          ...(song.artists || []),
          song.worshipTeam || "",
        ]),
      ]
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export function ArtistDirectory({
  songs,
  artists = [],
  heading = "Popular artists",
  eyebrow = "THE VOICES BEHIND THE SONGS",
  showLink = true,
  variant = "rail",
}: {
  songs: Song[];
  artists?: Artist[];
  heading?: string;
  eyebrow?: string;
  showLink?: boolean;
  variant?: "rail" | "grid";
}) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(variant === "grid" ? 12 : 6);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const names = artistNames(songs, artists);
  const visibleNames = useMemo(
    () =>
      names.filter((name) =>
        name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
      ),
    [names, query],
  );
  useEffect(() => {
    setVisibleCount(variant === "grid" ? 12 : 6);
  }, [query, variant]);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= visibleNames.length) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((count) =>
            Math.min(
              count + (variant === "grid" ? 12 : 6),
              visibleNames.length,
            ),
          );
        }
      },
      { rootMargin: "480px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [variant, visibleCount, visibleNames.length]);
  const profiles = new Map(
    artists.map((artist) => [artist.name.toLowerCase(), artist]),
  );
  return (
    <section className={`section artist-section artist-section-${variant}`}>
      <div className="section-head home-centered-head">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>{heading}</h2>
        </div>
        {showLink && (
          <Link className="text-link" href="/artists">
            See all <ArrowUpRight size={16} />
          </Link>
        )}
      </div>
      {variant === "grid" && (
        <label className="directory-filter">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search artists…"
            aria-label="Search artists"
          />
        </label>
      )}
      <div className="artist-grid">
        {visibleNames.slice(0, visibleCount).map((name) => {
          const profile = profiles.get(name.toLowerCase());
          const artistSongs = songs.filter(
            (song) =>
              (song.artists || [song.artist]).some(
                (artist) => artist.toLowerCase() === name.toLowerCase(),
              ) || song.worshipTeam?.toLowerCase() === name.toLowerCase(),
          );
          return (
            <Link
              className="artist-card"
              href={`/artists/${profile?.slug || artistSlug(name)}`}
              key={name}
            >
              <div className="artist-card-avatar">
                {profile?.image ? (
                  <img src={profile.image} alt="" />
                ) : (
                  artistInitials(name)
                )}
              </div>
              <div className="artist-card-body">
                <h3>{name}</h3>
                <p>
                  {artistSongs.some(
                    (song) =>
                      song.worshipTeam?.toLowerCase() === name.toLowerCase(),
                  )
                    ? "Worship team"
                    : "Artist"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      {visibleCount < visibleNames.length && (
        <div
          ref={sentinelRef}
          className="infinite-scroll-sentinel"
          role="status"
          aria-label="Loading more artists"
        >
          Loading more artists…
        </div>
      )}
      {!visibleNames.length && (
        <p className="empty-artists">
          {query
            ? "No artists match your search."
            : "Artists will appear here as songs are added."}
        </p>
      )}
    </section>
  );
}
