import { LanguageCards } from "@/components/LanguageCards";
import { LyricsLibrary } from "@/components/LyricsLibrary";
import { getSongs } from "@/lib/api";
export const metadata = { title: "Christian lyrics | Elroi Tunes" };
export default async function Browse() {
  const songs = await getSongs();
  return (
    <div className="page">
      <section className="lyrics-page-intro"><h1>All lyrics</h1></section>
      <section className="section">
        <LanguageCards />
      </section>
      <section className="section">
        <div className="section-head">
          <h2>Choose a language</h2>
        </div>
        <LyricsLibrary songs={songs} />
      </section>
    </div>
  );
}
