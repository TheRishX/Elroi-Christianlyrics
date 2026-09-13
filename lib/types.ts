export type Language = "hindi" | "nepali" | "english";
export type LyricSection = { label: string; original: string; roman?: string };
export type Song = {
  id: number;
  slug: string;
  title: string;
  romanTitle?: string;
  alternateTitles?: string[];
  romanAlternateTitles?: string[];
  language: Language;
  artist: string;
  excerpt?: string;
  lyrics: LyricSection[];
  genres?: string[];
  categories?: string[];
  youtubeUrl?: string;
  audioUrl?: string;
  updatedAt?: string;
  seo?: { title?: string; description?: string };
};
export type SearchMatchType =
  "title" | "roman_title" | "artist" | "lyrics" | "roman_lyrics";
export type SearchResult = Song & {
  matchType?: SearchMatchType;
  snippet?: string;
};
export type SongSuggestion = Pick<
  Song,
  "id" | "slug" | "title" | "language" | "artist"
> & { romanTitle?: string; matchType: SearchMatchType; snippet?: string };
