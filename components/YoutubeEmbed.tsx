function getVideoId(value: string) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") return url.pathname.slice(1).split("/")[0];
    if (host !== "youtube.com" && host !== "music.youtube.com" && host !== "m.youtube.com") return null;
    if (url.searchParams.get("v")) return url.searchParams.get("v");
    const match = url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

export function YoutubeEmbed({ url, title }: { url?: string; title: string }) {
  if (!url) return null;
  const videoId = getVideoId(url);
  if (!videoId || !/^[A-Za-z0-9_-]{6,}$/.test(videoId)) return null;

  return (
    <section className="youtube-embed" aria-label={`${title} video`}>
      <div className="youtube-embed-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          title={`${title} — YouTube video`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </section>
  );
}
