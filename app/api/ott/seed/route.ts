import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { cookieName, validSession } from "@/lib/auth";
import { OTT_SEED_CATEGORIES, OTT_SEED_STORIES } from "@/lib/ott-seed";

function base() { const value = process.env.WORDPRESS_API_URL; if (!value) throw new Error("WordPress is not configured yet."); return value.replace(/\/$/, ""); }
function headers() { const token = process.env.WORDPRESS_API_TOKEN || ""; return { "Content-Type": "application/json", Accept: "application/json", "X-Elroi-API-Token": token, Authorization: `Bearer ${token}` }; }
async function wp(path: string, init?: RequestInit) { const response = await fetch(`${base()}${path}`, { ...init, headers: { ...headers(), ...(init?.headers || {}) }, cache: "no-store" }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || data.error || `WordPress request failed (${response.status})`); return data; }

export async function POST() {
  if (!validSession((await cookies()).get(cookieName)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const existingCategories = (await wp("/video-categories")).items || [];
    const categoryIds = new Map<string, number>(existingCategories.map((item: { name: string; id: number }) => [item.name.toLowerCase(), item.id]));
    let categoriesCreated = 0;
    for (const category of OTT_SEED_CATEGORIES) {
      if (categoryIds.has(category.name.toLowerCase())) continue;
      const created = await wp("/video-categories", { method: "POST", body: JSON.stringify(category) });
      const item = created.item || created;
      if (item?.id) categoryIds.set(category.name.toLowerCase(), Number(item.id));
      categoriesCreated += 1;
    }
    const currentVideos = (await wp("/videos?admin=1")).items || [];
    const existingIds = new Set(currentVideos.map((item: { youtubeId?: string }) => item.youtubeId).filter(Boolean));
    let videosCreated = 0;
    let skipped = 0;
    for (const story of OTT_SEED_STORIES) {
      if (existingIds.has(story.youtubeId)) { skipped += 1; continue; }
      const categoryId = categoryIds.get(story.category.toLowerCase());
      if (!categoryId) throw new Error(`Category could not be created: ${story.category}`);
      await wp("/videos", { method: "POST", body: JSON.stringify({
        title: story.title, displayTitle: story.displayTitle, synopsis: story.synopsis, description: story.synopsis,
        youtubeUrl: `https://www.youtube.com/watch?v=${story.youtubeId}`, youtubeId: story.youtubeId,
        thumbnailUrl: `https://i.ytimg.com/vi/${story.youtubeId}/maxresdefault.jpg`, categoryId, language: story.language,
        contentType: story.contentType, topics: story.topics, featured: Boolean(story.featured), heroRank: story.heroRank || 0,
        shelfRank: story.shelfRank || 0, isReel: Boolean(story.isReel), status: "publish", channelName: story.channelName,
        channelId: "", duration: "", sourcePublishedAt: "", embeddable: true, privacyStatus: "public", sourceHealth: "ready",
      }) });
      existingIds.add(story.youtubeId); videosCreated += 1;
    }
    revalidateTag("videos", "max"); revalidateTag("video-categories", "max");
    ["/ott", "/ott/explore", "/ott/search", "/ott/reels", "/ott/my-list"].forEach((path) => revalidatePath(path));
    return NextResponse.json({ categoriesCreated, videosCreated, skipped, total: OTT_SEED_STORIES.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The launch collection could not be imported." }, { status: 502 });
  }
}
