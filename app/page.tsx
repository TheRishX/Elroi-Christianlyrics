import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { SongCard } from "@/components/SongCard";
import { LanguageCards } from "@/components/LanguageCards";
import { Icon } from "@/components/Icon";
import { getArtists, getSongs } from "@/lib/api";
import { AdSlot } from "@/components/AdSlot";
import { HeroFaithMark } from "@/components/HeroFaithMark";
import { ArtistDirectory } from "@/components/ArtistDirectory";
export default async function Home() {
  const [songs, artists] = await Promise.all([getSongs(), getArtists()]);
  return (
    <div className="page">
      <section className="hero hero-search" id="search-hero">
        <div className="hero-copy hero-copy-search">
          <HeroFaithMark />
          <div className="elroi-wordmark" aria-label="Elroi Tunes">
            <span className="word-elroi">Elroi</span>
            <span className="word-tunes">Tunes</span>
          </div>
          <h1>Find any Christian song lyrics.</h1>
          <p>
            Search Hindi, Nepali, and English worship songs in one simple place.
          </p>
          <SearchBox />
        </div>
      </section>
      <section className="section language-section home-centered-section">
        <div className="mobile-language-heading">
          <span className="eyebrow">YOUR LANGUAGE. YOUR SONG.</span>
          <h2>Worship in your own words.</h2>
        </div>
        <LanguageCards />
      </section>
      <AdSlot placement="homepage_banner" />
      <section className="section home-centered-section">
        <div className="section-head home-centered-head">
          <div>
            <span className="eyebrow">FRESH FROM THE COLLECTION</span>
            <h2>A new song for today</h2>
          </div>
        </div>
        <div className="song-grid">
          {songs.map((s) => (
            <SongCard key={s.id} song={s} />
          ))}
        </div>
        <Link className="text-link centered-text-link" href="/search">
          Explore all lyrics <Icon name="arrow" size={17} />
        </Link>
      </section>
      <ArtistDirectory songs={songs} artists={artists} />
    </div>
  );
}
