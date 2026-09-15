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
  worshipTeam?: string;
  excerpt?: string;
  lyrics: LyricSection[];
  genres?: string[];
  categories?: string[];
  youtubeUrl?: string;
  audioUrl?: string;
  updatedAt?: string;
  seo?: { title?: string; description?: string };
  composer?: string;
  lyricist?: string;
  album?: string;
  releaseYear?: string;
  songKey?: string;
  tempo?: string;
  songType?: string;
  themes?: string[];
  occasions?: string[];
  lastReviewedAt?: string;
  youtube?: { channel?: string; description?: string; thumbnail?: string; publishedAt?: string };
};
export type Artist = { id: number; slug: string; name: string; image?: string };
export type AdPlacement = { enabled: boolean; code?: string; imageUrl?: string; imageAlt?: string; linkUrl?: string; openNewTab?: boolean };
export type AdSettings = { global: boolean; placements: Record<string, AdPlacement>; provider?: string; clientId?: string };
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
