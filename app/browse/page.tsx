import { LanguageCards } from "@/components/LanguageCards";
import { SongCard } from "@/components/SongCard";
import { getSongs } from "@/lib/api";
export const metadata = { title: "Christian lyrics | Elroi Tunes" };
export default async function Browse() {
  const songs = await getSongs();
  return (
    <div className="page">
      <section className="language-banner">
        <span className="eyebrow">ALL CHRISTIAN LYRICS</span>
        <div className="elroi-wordmark page-wordmark" aria-label="Elroi Tunes">
          <span className="word-elroi">Elroi</span>
          <span className="word-tunes">Tunes</span>
        </div>
        <p>Find Hindi, Nepali, and English worship lyrics in one place.</p>
      </section>
      <section className="section">
        <LanguageCards />
      </section>
      <section className="section">
        <div className="section-head">
          <h2>All lyrics</h2>
        </div>
        <div className="song-grid">
          {songs.map((s) => (
            <SongCard key={s.id} song={s} />
          ))}
        </div>
      </section>
    </div>
  );
}
