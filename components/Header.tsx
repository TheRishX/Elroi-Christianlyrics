"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bookmark, BookOpen, House, Search } from "lucide-react";
const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/search", label: "Search", icon: Search },
  { href: "/browse", label: "Browse", icon: BookOpen },
  { href: "/bookmarks", label: "Saved", icon: Bookmark },
];
export function DesktopMenu() {
  const path = usePathname();
  const menuRef = useRef<HTMLElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    let originalTop = menu.getBoundingClientRect().top + window.scrollY;
    const update = () => {
      if (window.innerWidth <= 700) return setStuck(false);
      const height = menu.offsetHeight;
      setStuck(
        window.scrollY >= originalTop - window.innerHeight + height + 18,
      );
    };
    const resize = () => {
      setStuck(false);
      originalTop = menu.getBoundingClientRect().top + window.scrollY;
      update();
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", resize);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", resize);
    };
  }, []);
  const active = (href: string) =>
    href === "/browse"
      ? path === "/browse" || /^\/(hindi|nepali|english)/.test(path)
      : path === href;
  return (
    <nav
      ref={menuRef}
      className={`section-nav ${stuck ? "is-stuck" : ""}`}
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
  const active = (href: string) =>
    href === "/browse"
      ? path === "/browse" || /^\/(hindi|nepali|english)/.test(path)
      : path === href;
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {path !== "/" && (
        <nav className="utility-nav" aria-label="Page navigation">
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
