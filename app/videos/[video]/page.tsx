import { notFound } from "next/navigation";
import { getVideo } from "@/lib/api";
import { VideoWatch } from "@/components/VideoWatch";

export async function generateMetadata({ params }: { params: Promise<{ video: string }> }) {
  const video = await getVideo((await params).video);
  return { title: video ? `${video.title} | Videos` : "Video | Elroi Tunes" };
}
export default async function VideoPage({ params }: { params: Promise<{ video: string }> }) {
  const video = await getVideo((await params).video);
  if (!video) notFound();
  return <VideoWatch video={video} />;
}
