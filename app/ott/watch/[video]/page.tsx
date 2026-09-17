import { notFound } from "next/navigation";
import { getVideo, getVideos } from "@/lib/api";
import { OttWatch } from "@/components/OttWatch";
export async function generateMetadata({ params }: { params: Promise<{ video: string }> }) { const video = await getVideo((await params).video); return { title: video ? `${video.displayTitle || video.title} | Elroi OTT` : "Story | Elroi OTT" }; }
export default async function OttWatchPage({ params }: { params: Promise<{ video: string }> }) { const video = await getVideo((await params).video); if (!video) notFound(); const related = (await getVideos({ language: video.language })).filter((item) => item.id !== video.id && (item.category?.slug === video.category?.slug || item.contentType === video.contentType)).slice(0, 8); return <OttWatch video={video} related={related} />; }
