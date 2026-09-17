import type { Metadata } from "next";
import { OttManager } from "@/components/OttManager";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "OTT Studio | Elroi Tunes", robots: { index: false, follow: false } };
export default function StudioPage() { return <OttManager />; }
