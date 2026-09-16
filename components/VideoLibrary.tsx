"use client";
import Link from "next/link";
import { Play, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Video, VideoCategory } from "@/lib/types";

function Card({ video, featured = false }: { video: Video; featured?: boolean }) {
  return <Link href={`/videos/${video.slug}`} className={`video-card ${featured ? "video-card-featured" : ""}`}>
    <div className="video-card-image"><img src={video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`} alt="" loading="lazy" /><span className="video-play"><Play size={18} fill="currentColor" /></span></div>
    <div className="video-card-copy"><span>{video.category?.name || "Video"}</span><h3>{video.title}</h3>{video.description && <p>{video.description}</p>}</div>
  </Link>;
}
export function VideoLibrary({ videos, categories }: { videos: Video[]; categories: VideoCategory[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => videos.filter((video) => `${video.title} ${video.description || ""} ${video.category?.name || ""}`.toLowerCase().includes(query.toLowerCase().trim())), [videos, query]);
  const featured = filtered.find((video) => video.featured) || filtered[0];
  return <main className="videos-page page">
    <header className="videos-header"><div><span className="eyebrow">ELROI TUNES / WATCH</span><h1>Watch &amp; grow.</h1></div><label className="video-search"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search videos…" aria-label="Search videos" /></label></header>
    {!videos.length ? <div className="video-empty"><Play size={30} /><h2>Videos are coming soon.</h2><p>Check back when the first episode is added.</p></div> : <>
      {featured && <section className="video-feature"><div className="video-feature-image"><img src={featured.thumbnailUrl || `https://img.youtube.com/vi/${featured.youtubeId}/maxresdefault.jpg`} alt="" /><Link href={`/videos/${featured.slug}`} className="video-feature-cta"><Play size={18} fill="currentColor" /> Play now</Link></div><div className="video-feature-copy"><span className="eyebrow">FEATURED NOW</span><h2>{featured.title}</h2><p>{featured.description || "A new story from the Elroi Tunes video library."}</p><Link href={`/videos/${featured.slug}`} className="text-link">Watch episode <Play size={16} /></Link></div></section>}
      {categories.map((category) => { const rows = filtered.filter((video) => video.category?.slug === category.slug); return rows.length ? <section className="video-rail" key={category.id}><div className="video-section-head"><div><span className="eyebrow">{category.name.toUpperCase()}</span><h2>{category.name}</h2></div>{category.description && <p>{category.description}</p>}</div><div className="video-grid">{rows.map((video) => <Card key={video.id} video={video} />)}</div></section> : null; })}
      {categories.length > 0 && filtered.some((video) => !video.category) && <section className="video-rail"><div className="video-section-head"><div><span className="eyebrow">MORE TO WATCH</span><h2>More videos</h2></div></div><div className="video-grid">{filtered.filter((video) => !video.category).map((video) => <Card key={video.id} video={video} />)}</div></section>}
      {!categories.length && <section className="video-rail"><div className="video-grid">{filtered.map((video) => <Card key={video.id} video={video} />)}</div></section>}
      {categories.length && filtered.length && !categories.some((category) => filtered.some((video) => video.category?.slug === category.slug)) ? <div className="video-empty"><h2>No videos found.</h2><p>Try another search.</p></div> : null}
    </>}
  </main>;
}
