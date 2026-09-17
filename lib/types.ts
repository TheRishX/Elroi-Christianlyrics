export type Language = "hindi" | "nepali" | "english";
/**
 * Lyrics are stored as structured lines. The optional string fields keep old
 * WordPress records readable while they are migrated at the API boundary.
 */
export type LyricSection = {
  id?: string;
  label: string;
  original?: string;
  roman?: string;
  originalLines?: string[];
  romanLines?: string[];
};
export type Song = {
  id: number;
  slug: string;
  title: string;
  romanTitle?: string;
  alternateTitles?: string[];
  romanAlternateTitles?: string[];
  language: Language;
  artist: string;
  artists?: string[];
  artistIds?: number[];
  worshipTeam?: string;
  excerpt?: string;
  lyrics: LyricSection[];
  genres?: string[];
  categories?: string[];
  youtubeUrl?: string;
  audioUrl?: string;
  updatedAt?: string;
  revision?: number;
  integrity?: "valid" | "recovery_required";
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
export type VideoCategory = { id: number; slug: string; name: string; description?: string; count?: number };
export type VideoContentType = "message" | "worship" | "testimony" | "prayer" | "devotional" | "bible-story" | "kids-family" | "film-series";
export type Video = {
  id: number;
  slug: string;
  title: string;
  displayTitle?: string;
  description?: string;
  synopsis?: string;
  youtubeUrl: string;
  youtubeId: string;
  thumbnailUrl?: string;
  categoryId?: number;
  category?: VideoCategory;
  featured?: boolean;
  language?: Language;
  contentType?: VideoContentType;
  topics?: string[];
  heroRank?: number;
  shelfRank?: number;
  isReel?: boolean;
  channelName?: string;
  channelId?: string;
  duration?: string;
  sourcePublishedAt?: string;
  embeddable?: boolean;
  privacyStatus?: string;
  sourceHealth?: "ready" | "unavailable" | "unknown";
  curator?: string;
  status?: "publish" | "draft";
  publishedAt?: string;
  updatedAt?: string;
};
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
