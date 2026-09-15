import { ArtistDirectory } from "@/components/ArtistDirectory";
import { getArtists, getSongs } from "@/lib/api";

export const metadata = { title: "Artists | Elroi Tunes" };

export default async function ArtistsPage() {
  const [songs, artists] = await Promise.all([getSongs(), getArtists()]);
  return <div className="page artist-directory-page"><ArtistDirectory songs={songs} artists={artists} heading="Artists" eyebrow="" showLink={false} variant="grid" /></div>;
}
