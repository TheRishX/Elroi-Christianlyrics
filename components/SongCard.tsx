import Link from "next/link";
import { SearchResult, Song } from "@/lib/types";
import { Icon } from "./Icon";
export function SongCard({ song }: { song: Song | SearchResult }) {
  return (
    <Link className="song-card" href={`/${song.language}/${song.slug}`}>
      <div className={`song-art ${song.language}`} aria-hidden="true">
        <Icon name="music" size={28} />
      </div>
      <div className="song-info">
        <span className={`language-pill ${song.language}`}>
          {song.language}
        </span>
        <h3>{song.title}</h3>
        {"romanTitle" in song && song.romanTitle && (
          <span className="song-roman-title">{song.romanTitle}</span>
        )}
        <p>{song.artist}</p>
        {"snippet" in song && song.snippet && (
          <span className="song-match-snippet">{song.snippet}</span>
        )}
      </div>
      <span className="song-arrow">
        <Icon name="arrow" size={19} />
      </span>
    </Link>
  );
}
