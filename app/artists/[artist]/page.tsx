import { notFound } from "next/navigation";
import { Music2 } from "lucide-react";
import { ArtistDirectory } from "@/components/ArtistDirectory";
import { artistInitials, artistSlug } from "@/lib/artists";
import { SongCard } from "@/components/SongCard";
import { getArtists, getSongs } from "@/lib/api";

export const metadata = { title: "Artist | Elroi Tunes" };

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ artist: string }>;
}) {
  const { artist } = await params;
  const slug = artistSlug(decodeURIComponent(artist));
  const [songs, artists] = await Promise.all([getSongs(), getArtists()]);
  const profile = artists.find(
    (artist) =>
      artistSlug(artist.name) === slug ||
      artistSlug(artist.slug || "") === slug,
  );
  const artistSongs = songs.filter(
    (song) =>
      (song.artists || [song.artist]).some(
        (artist) => artistSlug(artist) === slug,
      ) || artistSlug(song.worshipTeam || "") === slug,
  );
  const name =
    profile?.name ||
    artistSongs
      .find((song) =>
        (song.artists || [song.artist]).some(
          (artist) => artistSlug(artist) === slug,
        ),
      )
      ?.artists?.find((artist) => artistSlug(artist) === slug) ||
    artistSongs.find((song) => artistSlug(song.worshipTeam || "") === slug)
      ?.worshipTeam ||
    slug;
  if (!profile && !artistSongs.length) notFound();
  return (
    <div className="page artist-profile-page">
      <section className="artist-profile-hero">
        <div className="artist-profile-mark" aria-hidden="true">
          <Music2 size={18} />
        </div>
        <div
          className="artist-profile-image"
          aria-label={`${name} profile image`}
        >
          {profile?.image ? (
            <img src={profile.image} alt="" />
          ) : (
            artistInitials(name)
          )}
        </div>
        <span className="eyebrow">ARTIST</span>
        <h1>{name}</h1>
        <p>
          {artistSongs.length
            ? `${artistSongs.length} song${artistSongs.length === 1 ? "" : "s"} in the collection`
            : "Artist profile"}
        </p>
      </section>
      <section className="artist-songs">
        <div className="section-head">
          <div>
            <span className="eyebrow">LYRICS BY {name.toUpperCase()}</span>
            <h2>Popular songs</h2>
          </div>
        </div>
        {artistSongs.length ? (
          <div className="song-grid">
            {artistSongs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        ) : (
          <p className="empty-artists">
            Songs by this artist will appear here when published.
          </p>
        )}
      </section>
      <ArtistDirectory
        songs={songs}
        artists={artists}
        excludeName={name}
        heading="Explore more artists"
        eyebrow="KEEP DISCOVERING"
      />
    </div>
  );
}
