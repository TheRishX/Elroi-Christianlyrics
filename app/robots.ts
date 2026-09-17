import { MetadataRoute } from "next";
function siteUrl() { return (process.env.NEXT_PUBLIC_SITE_URL || "https://elroitunes.com").replace(/\/$/, ""); }
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: "/", disallow: ["/upload", "/uploads", "/todo", "/jesus", "/bookmarks", "/search"] }, sitemap: `${siteUrl()}/sitemap.xml` }; }
