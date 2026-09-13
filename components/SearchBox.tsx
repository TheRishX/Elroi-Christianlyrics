"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
export function SearchBox({ compact = false, initial = "" }: { compact?: boolean; initial?: string }) { const [q, setQ] = useState(initial); const router = useRouter(); const submit = (e: FormEvent) => { e.preventDefault(); if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`); }; return <form className={`search-box ${compact ? "compact" : ""}`} onSubmit={submit}><span className="search-icon">⌕</span><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search songs, artists, or lyrics" aria-label="Search songs, artists, or lyrics"/><button aria-label="Search">Search</button></form>; }
