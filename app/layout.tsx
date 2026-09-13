import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { PWARegister } from "@/components/PWARegister";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Elroi Tunes — Christian Lyrics",
    template: "%s · Elroi Tunes",
  },
  description:
    "Find Hindi, Nepali, and English Christian song lyrics in original and Roman scripts.",
  manifest: "/manifest.webmanifest",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <PWARegister />
        <Header />
        <main id="main">{children}</main>
        <footer className="site-footer">
          <span>Elroi Tunes · Made for worship</span>
          <span>Lyrics for every heart, in every language.</span>
        </footer>
      </body>
    </html>
  );
}
