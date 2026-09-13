import { songs as mockSongs } from "./mock-data";
import { Song, Language } from "./types";
const base = process.env.WORDPRESS_API_URL;
export async function getSongs(language?: Language): Promise<Song[]> {
  if (!base) return language ? mockSongs.filter(s => s.language === language) : mockSongs;
  try { const url = new URL(`${base}/songs`); if (language) url.searchParams.set("language", language); const res = await fetch(url, { next: { revalidate: 300, tags: ["songs"] } }); if (!res.ok) throw new Error("WordPress unavailable"); return await res.json(); } catch { return language ? mockSongs.filter(s => s.language === language) : mockSongs; }
}
export async function getSong(slug: string): Promise<Song | undefined> {
  if (!base) return mockSongs.find(s => s.slug === slug);
  try { const res = await fetch(`${base}/songs/${encodeURIComponent(slug)}`, { next: { revalidate: 300, tags: [`song:${slug}`] } }); if (!res.ok) return undefined; return await res.json(); } catch { return mockSongs.find(s => s.slug === slug); }
}
export async function searchSongs(query: string, language?: Language): Promise<Song[]> {
  if (base) { try { const url=new URL(`${base}/search`); url.searchParams.set("q",query); if(language) url.searchParams.set("language",language); const res=await fetch(url,{next:{revalidate:60,tags:["search"]}}); if(res.ok){const data=await res.json(); return data.items || data;} } catch {} }
  const all = await getSongs(language); const q = query.toLowerCase().trim(); if (!q) return all;
  return all.filter(s => [s.title, s.artist, s.excerpt, ...s.lyrics.flatMap(l => [l.original, l.roman || ""])].join(" ").toLowerCase().includes(q));
}
