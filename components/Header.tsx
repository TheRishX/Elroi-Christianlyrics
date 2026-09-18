"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearOttGuest } from "@/lib/ott-guest";
import { ArrowLeft, Bookmark, BookOpen, House, ListVideo, Menu, Search, Sparkles, UploadCloud, UsersRound, Video, X } from "lucide-react";
const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/browse", label: "Lyrics", icon: BookOpen },
  { href: "/artists", label: "Artists", icon: UsersRound },
  { href: "/ott", label: "OTT", icon: Video },
];
const savedItem = { href: "/bookmarks", label: "Saved", icon: Bookmark };
const portalItems = [
  { href: "/upload", label: "Upload", icon: UploadCloud },
  { href: "/uploads", label: "Uploads", icon: UsersRound },
];
const studioItems = [
  ...portalItems,
  { href: "/studio", label: "Studio", icon: Video },
];
function portalNavigation(path: string) {
  return path === "/studio" ? studioItems : portalItems;
}
function isPortalPath(path: string) { return path === "/upload" || path === "/uploads" || path === "/studio"; }
function OttPortalLink({ children, className = "", ariaCurrent }: { children: React.ReactNode; className?: string; ariaCurrent?: "page" }) {
  const router = useRouter(); const [entering, setEntering] = useState(false);
  const enter = () => { router.prefetch("/ott"); if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return router.push("/ott"); setEntering(true); window.setTimeout(() => router.push("/ott"), 760); };
  return <>{entering && <div className="ott-portal" role="status"><span>✝</span><strong>Entering Elroi OTT</strong><small>A place for faith and hope</small></div>}<button type="button" aria-current={ariaCurrent} className={className} onMouseEnter={() => router.prefetch("/ott")} onFocus={() => router.prefetch("/ott")} onClick={enter}>{children}</button></>;
}
export function DesktopMenu() {
  const path = usePathname();
  const portalMode = isPortalPath(path);
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
      {(portalMode ? portalNavigation(path) : [...items, savedItem]).map((i) => (
        i.href === "/ott" ? <OttPortalLink key={i.href} ariaCurrent={active(i.href) ? "page" : undefined} className="section-nav-ott"><span className="section-nav-icon"><i.icon size={20} strokeWidth={1.8} /></span>{i.label}</OttPortalLink> :
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
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const moreClose = useRef<HTMLButtonElement>(null);
  const moreTrigger = useRef<HTMLButtonElement | null>(null);
  const closeMore = () => { setMoreOpen(false); window.setTimeout(() => moreTrigger.current?.focus(), 0); };
  const openMore = (event: React.MouseEvent<HTMLButtonElement>) => { moreTrigger.current = event.currentTarget; setMoreOpen(true); };
  const ottMode = path.startsWith("/ott") && !path.startsWith("/ott/settings");
  const portalMode = isPortalPath(path);
  useEffect(() => { if (!moreOpen) return; const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") closeMore(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [moreOpen]);
  useEffect(() => { setMoreOpen(false); setSearchOpen(false); }, [path]);
  useEffect(() => { if (searchOpen) searchInput.current?.focus(); }, [searchOpen]);
  useEffect(() => { if (moreOpen) moreClose.current?.focus(); }, [moreOpen]);
  useEffect(() => {
    document.body.classList.toggle("upload-mode", path === "/upload");
    document.body.classList.toggle("portal-mode", portalMode);
    document.body.classList.toggle("ott-mode", ottMode);
    return () => { document.body.classList.remove("upload-mode"); document.body.classList.remove("portal-mode"); document.body.classList.remove("ott-mode"); };
  }, [path, ottMode, portalMode]);
  const active = (href: string) =>
    href === "/browse"
      ? path === "/browse" || /^\/(hindi|nepali|english)/.test(path)
      : path === href;
  if (ottMode) return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="ott-chrome"><Link href="/" className="ott-return"><ArrowLeft size={18} /> <span>Return to Elroi Lyrics</span></Link><Link href="/ott" className="ott-brand"><span aria-hidden="true">✝</span> Elroi OTT</Link><nav aria-label="Elroi OTT navigation"><Link href="/ott" aria-current={path === "/ott" ? "page" : undefined}>Home</Link><Link href="/ott/explore" aria-current={path === "/ott/explore" ? "page" : undefined}>Explore</Link><Link href="/ott/reels" aria-current={path === "/ott/reels" ? "page" : undefined}>Reels</Link><Link href="/ott/my-list" aria-current={path === "/ott/my-list" ? "page" : undefined}>My List</Link></nav><button type="button" className="ott-search-trigger" aria-label="Search Elroi OTT" aria-expanded={searchOpen} onClick={() => setSearchOpen(true)}><Search size={23} /></button>{searchOpen && <form className="ott-header-search" role="search" onSubmit={(event) => { event.preventDefault(); router.push(`/ott/search?q=${encodeURIComponent(searchText.trim())}`); setSearchOpen(false); }}><Search size={22} aria-hidden="true" /><input ref={searchInput} type="search" value={searchText} onChange={(event) => setSearchText(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setSearchOpen(false); }} placeholder="Search stories of faith…" aria-label="Search Elroi OTT" /><button type="submit">Search</button><button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={20} /></button></form>}</div>
    <nav className="ott-bottom-nav" aria-label="Elroi OTT mobile navigation"><Link href="/ott" aria-current={path === "/ott" ? "page" : undefined}><House size={21} /><span>Home</span></Link><Link href="/ott/explore" aria-current={path === "/ott/explore" || path === "/ott/search" ? "page" : undefined}><Video size={21} /><span>Explore</span></Link><Link href="/ott/reels" aria-current={path === "/ott/reels" ? "page" : undefined}><Sparkles size={21} /><span>Reels</span></Link><Link href="/ott/my-list" aria-current={path === "/ott/my-list" ? "page" : undefined}><ListVideo size={21} /><span>My List</span></Link><button type="button" onClick={openMore}><Menu size={21} /><span>More</span></button></nav>
    {moreOpen && <div className="ott-sheet-backdrop" onMouseDown={closeMore}><aside className="ott-more-sheet" role="dialog" aria-modal="true" aria-label="More Elroi OTT options" onMouseDown={(event) => event.stopPropagation()} onKeyDown={(event) => { if (event.key !== "Tab") return; const buttons = event.currentTarget.querySelectorAll<HTMLElement>("button,a"); const first = buttons[0], last = buttons[buttons.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }}><button ref={moreClose} className="ott-sheet-close" type="button" onClick={closeMore} aria-label="Close menu"><X /></button><span className="ott-kicker">ELROI OTT</span><h2>Your journey</h2><Link href="/" onClick={() => setMoreOpen(false)}>Return to Elroi Lyrics</Link><button type="button" onClick={() => { clearOttGuest(); setMoreOpen(false); }}>Clear local journey data</button><p>New stories of faith, across English, Nepali, and Hindi.</p></aside></div>}
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
        <DesktopMenu />
      </div>
      <nav className={`bottom-nav${portalMode ? " portal-bottom-nav" : ""}`} aria-label={portalMode ? "Portal navigation" : "App navigation"}>
        {(portalMode ? portalNavigation(path) : [...items, savedItem]).map((i) => (
          i.href === "/ott" ? <OttPortalLink key={i.href} ariaCurrent={active(i.href) ? "page" : undefined} className="bottom-nav-ott"><span className="nav-icon"><i.icon size={22} strokeWidth={1.8} /></span><span>{i.label}</span></OttPortalLink> :
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
