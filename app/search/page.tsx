import { getSongs, searchSongs } from "@/lib/api";
import { SearchBox } from "@/components/SearchBox";
import { SongCard } from "@/components/SongCard";
import { AdSlot } from "@/components/AdSlot";
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: query } = await searchParams;
  const q = query || "";
  const results = q ? await searchSongs(q) : await getSongs();
  return (
    <div className="page results">
      <span className="eyebrow">Search the collection</span>
      <h1>Find your song</h1>
      <SearchBox compact initial={q} />
      <AdSlot placement="search_results" />
      <div className="section-head">
        <h2>{q ? `Results for “${q}”` : "All songs"}</h2>
        <span className="muted">{results.length} found</span>
      </div>
      {results.length ? (
        <div className="song-grid">
          {results.map((s) => (
            <SongCard key={s.id} song={s} />
          ))}
        </div>
      ) : (
        <p className="empty">
          No songs found yet. Try a different title, artist, or lyric phrase.
        </p>
      )}
    </div>
  );
}
