import type { Metadata } from "next";
import { OttExperience } from "@/components/OttExperience";
import { getVideoCategories, getVideos } from "@/lib/api";
export const metadata: Metadata = { title: "My List | Elroi OTT", description: "Your saved stories and faith journeys." };
export const revalidate = 120;
export default async function MyListPage() { const [videos, categories] = await Promise.all([getVideos(), getVideoCategories()]); return <OttExperience videos={videos} categories={categories} mode="my-list" />; }
