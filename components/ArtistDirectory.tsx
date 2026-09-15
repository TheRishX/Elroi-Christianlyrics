import Link from "next/link";
import { ArrowUpRight, Mic2 } from "lucide-react";
import { Song } from "@/lib/types";

function artistNames(songs: Song[]) {
  return Array.from(new Set(songs.flatMap((song) => [song.artist, song.worshipTeam || ""]).map((name) => name.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export function ArtistDirectory({ songs, heading = "Artists & worship teams", eyebrow = "THE VOICES BEHIND THE SONGS" }: { songs: Song[]; heading?: string; eyebrow?: string }) {
  const names = artistNames(songs);
  return <section className="section artist-section"><div className="section-head home-centered-head"><div><span className="eyebrow">{eyebrow}</span><h2>{heading}</h2></div><Link className="text-link" href="/artists">See all <ArrowUpRight size={16} /></Link></div><div className="artist-grid">{names.map((name) => <Link className="artist-chip" href={`/search?q=${encodeURIComponent(name)}`} key={name}><span className="artist-chip-icon"><Mic2 size={17} /></span><span>{name}</span><ArrowUpRight className="artist-chip-arrow" size={16} /></Link>)}</div>{!names.length && <p className="empty-artists">Artists will appear here as songs are added.</p>}</section>;
}
