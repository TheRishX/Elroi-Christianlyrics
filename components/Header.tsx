"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Bookmark, BookOpen, House, UsersRound } from "lucide-react";
import { SearchBox } from "@/components/SearchBox";
const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/artists", label: "Artists", icon: UsersRound },
  { href: "/browse", label: "Lyrics", icon: BookOpen },
  { href: "/bookmarks", label: "Saved", icon: Bookmark },
];
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
      {items.map((i) => (
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
  useEffect(() => {
    document.body.classList.toggle("upload-mode", path === "/upload");
    return () => document.body.classList.remove("upload-mode");
  }, [path]);
  const active = (href: string) =>
    href === "/browse"
      ? path === "/browse" || /^\/(hindi|nepali|english)/.test(path)
      : path === href;
  const showPageSearch = !["/", "/upload", "/uploads", "/todo"].includes(path) && !path.startsWith("/search");
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
        {showPageSearch && <div className="page-search"><SearchBox compact /></div>}
      </div>
      <nav className="bottom-nav" aria-label="App navigation">
        {items.map((i) => (
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
    </>
  );
}
