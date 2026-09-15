import { ArtistDirectory } from "@/components/ArtistDirectory";
import { getSongs } from "@/lib/api";

export const metadata = { title: "Artists | Elroi Tunes" };

export default async function ArtistsPage() {
  return <div className="page"><section className="language-banner"><span className="eyebrow">EXPLORE BY VOICE</span><div className="elroi-wordmark page-wordmark" aria-label="Elroi Tunes"><span className="word-elroi">Elroi</span><span className="word-tunes">Tunes</span></div><p>Find songs by the artists and worship teams who sing them.</p></section><ArtistDirectory songs={await getSongs()} heading="All artists & worship teams" eyebrow="THE COMPLETE DIRECTORY" /></div>;
}
