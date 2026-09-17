"use client";

import { Language } from "@/lib/types";

export type GuestStory = { id: number; slug: string; watchedAt: number; progress?: number; duration?: number };
export type OttGuestState = { version: 1; language?: Language; list: GuestStory[]; history: GuestStory[] };
const key = "elroi-ott-guest-v1";
const empty = (): OttGuestState => ({ version: 1, list: [], history: [] });

export function readOttGuest(): OttGuestState {
  if (typeof window === "undefined") return empty();
  try { const value = JSON.parse(window.localStorage.getItem(key) || "") as Partial<OttGuestState>; return { version: 1, language: value.language, list: Array.isArray(value.list) ? value.list : [], history: Array.isArray(value.history) ? value.history : [] }; } catch { return empty(); }
}
export function writeOttGuest(next: OttGuestState) { window.localStorage.setItem(key, JSON.stringify(next)); window.dispatchEvent(new Event("elroi-ott-guest")); }
export function chooseOttLanguage(language: Language) { const current = readOttGuest(); writeOttGuest({ ...current, language }); }
export function toggleOttList(story: Pick<GuestStory, "id" | "slug">) { const current = readOttGuest(); const saved = current.list.some((item) => item.id === story.id); writeOttGuest({ ...current, list: saved ? current.list.filter((item) => item.id !== story.id) : [{ ...story, watchedAt: Date.now() }, ...current.list].slice(0, 100) }); return !saved; }
export function recordOttProgress(story: Pick<GuestStory, "id" | "slug">, progress: number, duration = 0) { const current = readOttGuest(); const entry = { ...story, progress: Math.max(0, Math.floor(progress)), duration: Math.max(0, Math.floor(duration)), watchedAt: Date.now() }; writeOttGuest({ ...current, history: [entry, ...current.history.filter((item) => item.id !== story.id)].slice(0, 40) }); }
export function clearOttGuest() { writeOttGuest(empty()); }
