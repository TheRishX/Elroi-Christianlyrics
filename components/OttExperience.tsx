"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, Search, Share2, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Language, Video, VideoCategory, VideoContentType } from "@/lib/types";

const languages: { id: Language; label: string; native: string }[] = [
  { id: "english", label: "English", native: "EN" },
  { id: "nepali", label: "Nepali", native: "नेपाली" },
  { id: "hindi", label: "Hindi", native: "हिन्दी" },
];
const typeLabels: Record<VideoContentType, string> = { message: "Message", worship: "Worship", testimony: "Story", prayer: "Prayer", devotional: "Devotional", "bible-story": "Bible Story", "kids-family": "Kids & Family", "film-series": "Film & Series" };
const shelfTypes: { title: string; type?: VideoContentType; category?: string }[] = [
  { title: "Featured This Week" }, { title: "Worship & Praise", type: "worship" }, { title: "Messages of Hope", type: "message" }, { title: "Testimonies", type: "testimony" }, { title: "Prayer & Devotion", type: "prayer" }, { title: "Bible Stories", type: "bible-story" }, { title: "Family & Kids", type: "kids-family" }, { title: "Christian Films & Series", type: "film-series" }, { title: "More to Explore" },
];
function displayTitle(video: Video) { return video.displayTitle || video.title; }
function thumbnail(video: Video) { return video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`; }
function languageLabel(language?: Language) { return languages.find((item) => item.id === language)?.native || "English"; }
function contentLabel(video: Video) { return video.isReel ? "Elroi Reel" : video.contentType ? typeLabels[video.contentType] : video.category?.name || "Journey"; }

function LanguagePicker({ value, onChange, compact = false }: { value: Language | null; onChange: (language: Language) => void; compact?: boolean }) {
  return <div className={compact ? "ott-language-strip" : "ott-language-picker"} role="group" aria-label="Choose content language">
    {languages.map((language) => <button key={language.id} type="button" className={value === language.id ? "is-active" : ""} onClick={() => onChange(language.id)}><span>{language.native}</span>{!compact && <small>{language.label}</small>}</button>)}
  </div>;
}

function Card({ video }: { video: Video }) {
  return <Link href={`/ott/watch/${video.slug}`} className="ott-media-card">
    <div className="ott-media-image"><img src={thumbnail(video)} alt="" loading="lazy" /><span className="ott-play"><Play size={15} fill="currentColor" /></span>{video.isReel && <span className="ott-reel-badge">REEL</span>}</div>
    <div className="ott-media-copy"><span>{contentLabel(video)} · {languageLabel(video.language)}</span><h3>{displayTitle(video)}</h3><p>{video.channelName || "Elroi Christian content"}</p></div>
  </Link>;
}

function Reel({ video }: { video: Video }) {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => { const element = frame.current; if (!element) return; const observer = new IntersectionObserver(([entry]) => { element.contentWindow?.postMessage(JSON.stringify({ event: "command", func: entry.isIntersecting ? "playVideo" : "pauseVideo", args: [] }), "https://www.youtube-nocookie.com"); }, { threshold: 0.72 }); observer.observe(element); return () => observer.disconnect(); }, []);
  const share = async () => { const url = `${window.location.origin}/ott/watch/${video.slug}`; if (navigator.share) await navigator.share({ title: displayTitle(video), url }); else await navigator.clipboard?.writeText(url); };
  return <article className="ott-reel"><iframe ref={frame} src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&autoplay=1&mute=1`} title={displayTitle(video)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /><div><span>{languageLabel(video.language)} · Elroi Reel</span><h2>{displayTitle(video)}</h2><p>{video.channelName || "Elroi Christian content"}</p><button type="button" onClick={() => void share()}><Share2 size={16} /> Share</button></div></article>;
}

function Hero({ videos }: { videos: Video[] }) {
  const [index, setIndex] = useState(0); const [paused, setPaused] = useState(false); const touchStart = useRef<number | null>(null);
  useEffect(() => { setIndex(0); }, [videos]);
  useEffect(() => { if (videos.length < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; const timer = window.setInterval(() => setIndex((current) => (current + 1) % videos.length), 7000); return () => window.clearInterval(timer); }, [videos.length, paused]);
  if (!videos.length) return <section className="ott-empty-hero"><span>ELROI OTT</span><h1>Stories of faith are arriving soon.</h1><p>Choose a language and return soon for worship, hope, and encouragement.</p></section>;
  const video = videos[index];
  return <section className="ott-hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} onTouchStart={(event) => { touchStart.current = event.changedTouches[0]?.clientX || null; }} onTouchEnd={(event) => { if (touchStart.current === null) return; const delta = (event.changedTouches[0]?.clientX || 0) - touchStart.current; if (Math.abs(delta) > 45) setIndex((current) => (current + (delta < 0 ? 1 : videos.length - 1)) % videos.length); touchStart.current = null; }}>
    <img className="ott-hero-image" src={thumbnail(video)} alt="" /> <div className="ott-hero-shade" />
    <div className="ott-hero-copy"><span className="ott-kicker">{contentLabel(video)} · {languageLabel(video.language)}</span><h1>{displayTitle(video)}</h1><p>{video.synopsis || video.description || "A faith-filled story curated for your journey."}</p><small>{video.channelName || "Elroi OTT"}</small><Link href={`/ott/watch/${video.slug}`} className="ott-watch-button"><Play size={17} fill="currentColor" /> Watch now</Link></div>
    {videos.length > 1 && <><button className="ott-hero-arrow ott-prev" type="button" onClick={() => setIndex((index + videos.length - 1) % videos.length)} aria-label="Previous featured story"><ChevronLeft /></button><button className="ott-hero-arrow ott-next" type="button" onClick={() => setIndex((index + 1) % videos.length)} aria-label="Next featured story"><ChevronRight /></button><div className="ott-dots">{videos.map((item, itemIndex) => <button key={item.id} type="button" className={itemIndex === index ? "is-active" : ""} onClick={() => setIndex(itemIndex)} aria-label={`Show featured story ${itemIndex + 1}`} />)}</div></>}
  </section>;
}

function SearchAndFilters({ videos, categories, initialSearch = false }: { videos: Video[]; categories: VideoCategory[]; initialSearch?: boolean }) {
  const [query, setQuery] = useState(""); const [category, setCategory] = useState(""); const [type, setType] = useState(""); const [language, setLanguage] = useState<"all" | Language>("all");
  const results = useMemo(() => videos.filter((video) => { const haystack = `${displayTitle(video)} ${video.title} ${video.synopsis || ""} ${video.description || ""} ${video.channelName || ""} ${(video.topics || []).join(" ")}`.toLowerCase(); return (!query || haystack.includes(query.toLowerCase())) && (!category || video.category?.slug === category) && (!type || video.contentType === type) && (language === "all" || video.language === language); }), [videos, query, category, type, language]);
  return <section className="ott-discovery"><div className="ott-discovery-head"><div><span className="ott-kicker">DISCOVER</span><h1>{initialSearch ? "Find what your heart needs." : "Explore every faith journey."}</h1></div></div><div className="ott-filters"><label><Search size={18} /><input autoFocus={initialSearch} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search messages, worship, topics…" /></label><span><SlidersHorizontal size={16} /> Filters</span><select value={language} onChange={(event) => setLanguage(event.target.value as "all" | Language)}><option value="all">All languages</option>{languages.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select><select value={type} onChange={(event) => setType(event.target.value)}><option value="">All content</option>{Object.entries(typeLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></div><p className="ott-results-count">{results.length} {results.length === 1 ? "story" : "stories"} found</p>{results.length ? <div className="ott-results-grid">{results.map((video) => <Card key={video.id} video={video} />)}</div> : <div className="ott-no-results"><Search size={27} /><h2>No stories found yet.</h2><p>Try a different language, category, or search phrase.</p></div>}</section>;
}

export function OttExperience({ videos, categories, mode = "home" }: { videos: Video[]; categories: VideoCategory[]; mode?: "home" | "explore" | "search" | "reels" }) {
  const [language, setLanguage] = useState<Language>("english"); const [pickerOpen, setPickerOpen] = useState(false);
  useEffect(() => { const stored = window.localStorage.getItem("elroi-ott-language") as Language | null; if (stored && languages.some((item) => item.id === stored)) setLanguage(stored); const openPicker = () => setPickerOpen(true); window.addEventListener("elroi-ott-language", openPicker); return () => window.removeEventListener("elroi-ott-language", openPicker); }, []);
  const choose = (next: Language) => { window.localStorage.setItem("elroi-ott-language", next); setLanguage(next); setPickerOpen(false); };
  const activeVideos = useMemo(() => videos.filter((video) => video.language === language), [videos, language]);
  const languageModal = pickerOpen ? <div className="ott-language-modal" role="dialog" aria-modal="true" aria-label="Choose language"><button type="button" onClick={() => setPickerOpen(false)} aria-label="Close language picker"><X /></button><p className="ott-kicker">YOUR LANGUAGE</p><h2>Watch in the language that feels like home.</h2><LanguagePicker value={language} onChange={choose} /></div> : null;
  if (mode === "explore" || mode === "search") return <main className="ott-page ott-subpage"><LanguagePicker compact value={language} onChange={choose} /><SearchAndFilters videos={videos} categories={categories} initialSearch={mode === "search"} />{languageModal}</main>;
  if (mode === "reels") { const reels = activeVideos.filter((video) => video.isReel); return <main className="ott-page ott-reels-page"><LanguagePicker compact value={language} onChange={choose} /><header><span className="ott-kicker">ELROI REELS</span><h1>Small moments. Lasting hope.</h1></header><div className="ott-reels-feed">{reels.map((video) => <Reel key={video.id} video={video} />)}</div>{!reels.length && <div className="ott-no-results"><Play size={27} /><h2>Reels are coming soon.</h2><p>New moments of hope will appear here.</p></div>}{languageModal}</main>; }
  const featured = activeVideos.filter((video) => video.featured).sort((a, b) => (a.heroRank || 999) - (b.heroRank || 999)).slice(0, 10); const hero = featured.length ? featured : activeVideos.slice(0, 10);
  return <main className="ott-page"><Hero videos={hero} /><div className="ott-home-content"><div className="ott-language-row"><div><span className="ott-kicker">WATCH IN YOUR LANGUAGE</span><h2>Made for your faith journey.</h2></div><LanguagePicker compact value={language} onChange={choose} /></div><div className="ott-category-chips"><Link href="/ott/explore">All stories</Link>{categories.map((category) => <Link key={category.id} href={`/ott/explore?category=${category.slug}`}>{category.name}</Link>)}</div>{shelfTypes.map((shelf, index) => { const items = index === 0 ? featured : shelf.type ? activeVideos.filter((video) => video.contentType === shelf.type && !video.isReel) : activeVideos.filter((video) => !video.isReel); return items.length ? <section className="ott-shelf" key={shelf.title}><div><span className="ott-kicker">{index === 0 ? "CURATED FOR YOU" : "ELROI OTT"}</span><h2>{shelf.title}</h2></div><div className="ott-card-rail">{items.slice(0, 12).map((video) => <Card key={video.id} video={video} />)}</div></section> : null; })}</div>{languageModal}</main>;
}
