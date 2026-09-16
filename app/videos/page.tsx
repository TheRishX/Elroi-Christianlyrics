import { getVideoCategories, getVideos } from "@/lib/api";
import { VideoLibrary } from "@/components/VideoLibrary";

export const metadata = { title: "Videos | Elroi Tunes" };
export const revalidate = 120;

export default async function VideosPage() {
  const [videos, categories] = await Promise.all([getVideos(), getVideoCategories()]);
  return <VideoLibrary videos={videos} categories={categories} />;
}
