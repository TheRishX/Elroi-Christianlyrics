export type Language = "hindi" | "nepali" | "english";
export type LyricSection = { label: string; original: string; roman?: string };
export type Song = {
  id: number; slug: string; title: string; language: Language; artist: string; excerpt?: string;
  lyrics: LyricSection[]; genres?: string[]; categories?: string[]; youtubeUrl?: string; audioUrl?: string;
  updatedAt?: string; seo?: { title?: string; description?: string };
};
