import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import { Video } from "@/lib/types";

export function VideoWatch({ video }: { video: Video }) {
  return <main className="video-watch page">
    <Link href="/videos" className="video-back"><ArrowLeft size={16} /> Back to videos</Link>
    <div className="video-player-shell"><iframe src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&modestbranding=1`} title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
    <div className="video-watch-copy"><span className="eyebrow">{video.category?.name || "ELROI TUNES VIDEO"}</span><h1>{video.title}</h1>{video.description && <p>{video.description}</p>}<a className="video-youtube-link" href={video.youtubeUrl} target="_blank" rel="noreferrer"><Play size={16} /> Watch on YouTube</a></div>
  </main>;
}
