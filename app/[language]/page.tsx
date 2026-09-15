import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { LyricsLibrary } from "@/components/LyricsLibrary";
import { getSongs } from "@/lib/api";
import { Language } from "@/lib/types";

const languageLabels: Record<Language, string> = {
  hindi: "Hindi / हिन्दी",
  nepali: "Nepali / नेपाली",
  english: "English",
};

export default async function LanguagePage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  if (!(language in languageLabels)) notFound();

  const lang = language as Language;
  const songs = await getSongs(lang);
  const label = languageLabels[lang];

  return (
    <div className="page">
      <section className="language-banner">
        <span className="eyebrow">Song collection</span>
        <h1>{label} lyrics</h1>
        <p>
          Find songs in {label.toLowerCase()}, thoughtfully formatted for
          reading and singing.
        </p>
      </section>
      <AdSlot placement={`${lang}_category`} />
      <section className="section language-song-library">
        <div className="section-head">
          <h2>All songs</h2>
          <span className="muted">{songs.length} songs</span>
        </div>
        <LyricsLibrary
          songs={songs}
          placeholder={`Search ${lang} songs or lyrics…`}
        />
      </section>
    </div>
  );
}
