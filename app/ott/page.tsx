import type { Metadata } from "next";
import { OttExperience } from "@/components/OttExperience";
import { getVideoCategories, getVideos } from "@/lib/api";
export const metadata: Metadata = { title: "Elroi OTT — Faith, hope & stories", description: "Christian worship, messages, testimonies, and stories in English, Nepali, and Hindi." };
export const revalidate = 120;
export default async function OttPage() { const [videos, categories] = await Promise.all([getVideos(), getVideoCategories()]); return <OttExperience videos={videos} categories={categories} />; }
