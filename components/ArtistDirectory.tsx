import Link from "next/link";
import { ArrowUpRight, Mic2 } from "lucide-react";
import { Artist, Song } from "@/lib/types";

export function artistSlug(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
export function artistInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : (parts[0]?.slice(0, 2) || "A").toUpperCase();
}

function artistNames(songs: Song[]) {
  return Array.from(new Set(songs.flatMap((song) => [song.artist, song.worshipTeam || ""]).map((name) => name.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export function ArtistDirectory({ songs, artists = [], heading = "Popular artists", eyebrow = "THE VOICES BEHIND THE SONGS", showLink = true, variant = "rail" }: { songs: Song[]; artists?: Artist[]; heading?: string; eyebrow?: string; showLink?: boolean; variant?: "rail" | "grid" }) {
  const names = artistNames(songs);
  const profiles = new Map(artists.map((artist) => [artist.name.toLowerCase(), artist]));
  return <section className={`section artist-section artist-section-${variant}`}><div className="section-head home-centered-head"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{heading}</h2></div>{showLink && <Link className="text-link" href="/artists">See all <ArrowUpRight size={16} /></Link>}</div><div className="artist-grid">{names.map((name) => { const profile = profiles.get(name.toLowerCase()); const artistSongs = songs.filter((song) => song.artist.toLowerCase() === name.toLowerCase() || song.worshipTeam?.toLowerCase() === name.toLowerCase()); return <Link className="artist-card" href={`/artists/${profile?.slug || artistSlug(name)}`} key={name}><div className="artist-card-avatar">{profile?.image ? <img src={profile.image} alt="" /> : artistInitials(name)}</div><div className="artist-card-body"><h3>{name}</h3><p>{artistSongs.some((song) => song.worshipTeam?.toLowerCase() === name.toLowerCase()) ? "Worship team" : "Artist"}</p></div></Link>; })}</div>{!names.length && <p className="empty-artists">Artists will appear here as songs are added.</p>}</section>;
}
