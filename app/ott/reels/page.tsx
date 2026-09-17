import { OttExperience } from "@/components/OttExperience";
import { getVideoCategories, getVideos } from "@/lib/api";
export const metadata = { title: "Elroi Reels" };
export const revalidate = 120;
export default async function ReelsPage() { const [videos, categories] = await Promise.all([getVideos({ reels: true }), getVideoCategories()]); return <OttExperience videos={videos} categories={categories} mode="reels" />; }
