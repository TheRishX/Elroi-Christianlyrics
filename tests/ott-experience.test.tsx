import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { OttExperience } from "@/components/OttExperience";
import type { Video, VideoCategory } from "@/lib/types";

const category = { id: 1, slug: "worship", name: "Worship & Praise", count: 10 } as VideoCategory;
function stories(count: number): Video[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1, slug: `story-${index + 1}`, title: `Story ${index + 1}`,
    youtubeUrl: `https://youtube.com/watch?v=id${index + 1}`,
    youtubeId: `id${index + 1}`, language: "english", contentType: "worship",
    featured: true, heroRank: index + 1, isReel: false, category,
  } as Video));
}
describe("OTT public catalogue", () => {
  it("shows an editorial empty state when WordPress has no stories", () => {
    const html = renderToStaticMarkup(<OttExperience videos={[]} categories={[]} />);
    expect(html).toContain("Stories that stay with you.");
    expect(html).not.toContain("ott-media-card");
  });
  for (const count of [1, 5, 10]) it(`builds a ${count}-story hero without invented cards`, () => {
    const html = renderToStaticMarkup(<OttExperience videos={stories(count)} categories={[category]} />);
    expect(html).toContain("Start watching");
    expect(html).toContain("Story 1");
    expect((html.match(/Show featured story/g) || []).length).toBe(count > 1 ? count : 0);
    expect(html).toContain("/ott/explore?category=worship");
  });
  it("keeps language controls inside search only", () => {
    const home = renderToStaticMarkup(<OttExperience videos={stories(1)} categories={[category]} />);
    const search = renderToStaticMarkup(<OttExperience videos={stories(1)} categories={[category]} mode="search" />);
    expect(home).not.toContain("All languages");
    expect(search).toContain("All languages");
    expect(search).toContain("Search OTT stories");
  });
});
