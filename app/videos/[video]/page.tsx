import { permanentRedirect } from "next/navigation";
export default async function VideoPage({ params }: { params: Promise<{ video: string }> }) { permanentRedirect(`/ott/watch/${(await params).video}`); }
