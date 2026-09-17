"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, BookOpen, House, Languages, Search, Sparkles, UsersRound, Video } from "lucide-react";
const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/artists", label: "Artists", icon: UsersRound },
  { href: "/browse", label: "Lyrics", icon: BookOpen },
  { href: "/ott", label: "OTT", icon: Video },
];
const savedItem = { href: "/bookmarks", label: "Saved", icon: Bookmark };
function OttPortalLink({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const router = useRouter(); const [entering, setEntering] = useState(false);
  const enter = () => { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return router.push("/ott"); setEntering(true); window.setTimeout(() => router.push("/ott"), 900); };
  return <>{entering && <div className="ott-portal" role="status"><span>✦</span><strong>Entering Elroi OTT</strong><small>A place for faith and hope</small></div>}<button type="button" className={className} onClick={enter}>{children}</button></>;
}
export function DesktopMenu() {
  const path = usePathname();
  const active = (href: string) =>
    href === "/browse"
      ? path === "/browse" || /^\/(hindi|nepali|english)/.test(path)
      : href === "/artists"
        ? path === "/artists" || path.startsWith("/artists/")
      : path === href;
  return (
    <nav
      className="section-nav"
      aria-label="Main navigation"
    >
      {[...items, savedItem].map((i) => (
        i.href === "/ott" ? <OttPortalLink key={i.href} className="section-nav-ott"><span className="section-nav-icon"><i.icon size={20} strokeWidth={1.8} /></span>{i.label}</OttPortalLink> :
        <Link
          key={i.href}
          href={i.href}
          aria-current={active(i.href) ? "page" : undefined}
        >
          <span className="section-nav-icon">
            <i.icon size={20} strokeWidth={1.8} />
          </span>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
export function Header() {
  const path = usePathname();
  const router = useRouter();
  const ottMode = path.startsWith("/ott") && !path.startsWith("/ott/settings");
  useEffect(() => {
    document.body.classList.toggle("upload-mode", path === "/upload");
    document.body.classList.toggle("ott-mode", ottMode);
    return () => { document.body.classList.remove("upload-mode"); document.body.classList.remove("ott-mode"); };
  }, [path, ottMode]);
  const active = (href: string) =>
    href === "/browse"
      ? path === "/browse" || /^\/(hindi|nepali|english)/.test(path)
      : path === href;
  if (ottMode) return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="ott-chrome"><Link href="/" className="ott-return"><ArrowLeft size={17} /> Return to Elroi Lyrics</Link><Link href="/ott" className="ott-brand"><Sparkles size={17} /> Elroi OTT</Link><nav aria-label="Elroi OTT navigation"><Link href="/ott">Home</Link><Link href="/ott/explore">Explore</Link><Link href="/ott/reels">Reels</Link><Link href="/ott/search"><Search size={16} /> Search</Link><button type="button" onClick={() => window.dispatchEvent(new Event("elroi-ott-language"))}><Languages size={16} /> Languages</button></nav></div>
    <nav className="ott-bottom-nav" aria-label="Elroi OTT mobile navigation"><Link href="/ott" aria-current={path === "/ott" ? "page" : undefined}><House size={21} /><span>Home</span></Link><Link href="/ott/explore" aria-current={path === "/ott/explore" ? "page" : undefined}><Video size={21} /><span>Explore</span></Link><Link href="/ott/reels" aria-current={path === "/ott/reels" ? "page" : undefined}><Sparkles size={21} /><span>Reels</span></Link><Link href="/ott/search" aria-current={path === "/ott/search" ? "page" : undefined}><Search size={21} /><span>Search</span></Link><button type="button" onClick={() => window.dispatchEvent(new Event("elroi-ott-language"))}><Languages size={21} /><span>Language</span></button></nav>
  </>;
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="top-chrome">
        {path !== "/" && (
          <nav className="utility-nav" aria-label="Page navigation">
            <Link className="utility-brand" href="/" aria-label="Elroi Tunes home">Elroi <em>Tunes</em></Link>
            <button
              type="button"
              className="utility-back"
              onClick={() =>
                window.history.length > 1 ? router.back() : router.push("/")
              }
              aria-label="Go back"
            >
              <ArrowLeft size={18} strokeWidth={1.8} />
              <span>Back</span>
            </button>
          </nav>
        )}
        {path !== "/upload" && <DesktopMenu />}
      </div>
      <nav className="bottom-nav" aria-label="App navigation">
        {items.map((i) => (
          i.href === "/ott" ? <OttPortalLink key={i.href} className="bottom-nav-ott"><span className="nav-icon"><i.icon size={22} strokeWidth={1.8} /></span><span>{i.label}</span></OttPortalLink> :
          <Link
            key={i.href}
            href={i.href}
            aria-current={active(i.href) ? "page" : undefined}
          >
            <span className="nav-icon">
              <i.icon size={22} strokeWidth={1.8} />
            </span>
            <span>{i.label}</span>
          </Link>
        ))}
      </nav>
      <Link className="mobile-saved-link" href={savedItem.href} aria-label="Saved songs">
        <Bookmark size={16} /> Saved
      </Link>
    </>
  );
}
