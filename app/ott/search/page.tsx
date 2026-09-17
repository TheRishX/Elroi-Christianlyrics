import { OttExperience } from "@/components/OttExperience";
import { getVideoCategories, getVideos } from "@/lib/api";
export const metadata = { title: "Search | Elroi OTT" };
export const revalidate = 120;
export default async function SearchPage() { const [videos, categories] = await Promise.all([getVideos(), getVideoCategories()]); return <OttExperience videos={videos} categories={categories} mode="search" />; }
