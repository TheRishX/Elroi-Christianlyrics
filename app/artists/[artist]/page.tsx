import { notFound } from "next/navigation";
import { Mic2, Music2 } from "lucide-react";
import { ArtistDirectory, artistInitials, artistSlug } from "@/components/ArtistDirectory";
import { SongCard } from "@/components/SongCard";
import { getArtists, getSongs } from "@/lib/api";

export const metadata = { title: "Artist | Elroi Tunes" };

export default async function ArtistPage({ params }: { params: Promise<{ artist: string }> }) {
  const { artist: slug } = await params;
  const [songs, artists] = await Promise.all([getSongs(), getArtists()]);
  const artistSongs = songs.filter((song) => artistSlug(song.artist) === slug || artistSlug(song.worshipTeam || "") === slug);
  if (!artistSongs.length) notFound();
  const name = artistSongs.find((song) => artistSlug(song.artist) === slug)?.artist || artistSongs.find((song) => artistSlug(song.worshipTeam || "") === slug)?.worshipTeam || slug;
  const profile = artists.find((artist) => artistSlug(artist.name) === slug);
  return <div className="page artist-profile-page"><section className="artist-profile-hero"><div className="artist-profile-mark" aria-hidden="true"><Music2 size={18} /></div><div className="artist-profile-image" aria-label={`${name} profile image`}>{profile?.image ? <img src={profile.image} alt="" /> : artistInitials(name)}</div><span className="eyebrow">ARTIST</span><h1>{name}</h1><p>{artistSongs.length} song{artistSongs.length === 1 ? "" : "s"} in the collection</p></section><section className="artist-songs"><div className="section-head"><div><span className="eyebrow">LYRICS BY {name.toUpperCase()}</span><h2>Popular songs</h2></div></div><div className="song-grid">{artistSongs.map((song) => <SongCard key={song.id} song={song} />)}</div></section><ArtistDirectory songs={songs} artists={artists} heading="Explore more artists" eyebrow="KEEP DISCOVERING" /></div>;
}
