"use client";
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { SongSuggestion } from "@/lib/types";

function Highlight({ value, query }: { value: string; query: string }) {
  const needle = query.trim().toLocaleLowerCase();
  const index = needle ? value.toLocaleLowerCase().indexOf(needle) : -1;
  if (index < 0) return <>{value}</>;
  return (
    <>
      {value.slice(0, index)}
      <mark>{value.slice(index, index + needle.length)}</mark>
      {value.slice(index + needle.length)}
    </>
  );
}

export function SearchBox({
  compact = false,
  initial = "",
}: {
  compact?: boolean;
  initial?: string;
}) {
  const router = useRouter();
  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(initial);
  const [items, setItems] = useState<SongSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  useEffect(() => {
    if (query) return;
    const phrases = [
      "Try: yeshu tera naam…",
      "Yeshu tera naam sabse uncha hai…",
      "Search a line you remember…",
      "खोजें: यीशु मेरा सहारा…",
      "खोज्नुहोस्: प्रभुको महिमा…",
    ];
    let phrase = 0;
    let character = 0;
    let deleting = false;
    let timeout: number;
    const tick = () => {
      const current = phrases[phrase];
      character += deleting ? -1 : 1;
      setTypedPlaceholder(current.slice(0, character));
      let delay = deleting ? 34 : 68;
      if (!deleting && character === current.length) {
        deleting = true;
        delay = 1800;
      } else if (deleting && character === 0) {
        deleting = false;
        phrase = (phrase + 1) % phrases.length;
        delay = 350;
      }
      timeout = window.setTimeout(tick, delay);
    };
    timeout = window.setTimeout(tick, 500);
    return () => window.clearTimeout(timeout);
  }, [query]);
  useEffect(() => {
    if (query.trim().length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          "/api/suggestions?q=" + encodeURIComponent(query.trim()),
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Suggestion request failed");
        const data = await response.json();
        setItems(data.items || []);
        setOpen(true);
        setActive(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setItems([]);
          setOpen(false);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  function go(url: string) {
    setOpen(false);
    router.push(url);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (active >= 0 && items[active]) {
      go("/" + items[active].language + "/" + items[active].slug);
      return;
    }
    if (query.trim()) go("/search?q=" + encodeURIComponent(query.trim()));
  }
  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((value) => Math.min(value + 1, items.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((value) => Math.max(value - 1, -1));
    } else if (event.key === "Escape") setOpen(false);
  }
  return (
    <div className="search-wrap" ref={wrapperRef}>
      <form
        action="/search"
        role="search"
        className={"search-box " + (compact ? "compact" : "")}
        onSubmit={submit}
      >
        <Icon name="search" />
        <input
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => items.length && setOpen(true)}
          onKeyDown={keyDown}
          placeholder={
            query ? "A song, an artist, a line you remember…" : typedPlaceholder
          }
          aria-label="Search song titles, artists, or lyrics"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          aria-activedescendant={
            active >= 0 ? `${listId}-option-${active}` : undefined
          }
        />
        <button type="submit" aria-label="Search songs">
          <span>Find lyrics</span>
          <Icon name="arrow" size={20} />
        </button>
      </form>
      {open && (
        <div
          className="suggestions"
          id={listId}
          role="listbox"
          aria-label="Song suggestions"
        >
          {loading && <div className="suggestion-status">Searching…</div>}
          {!loading && items.length === 0 && (
            <div className="suggestion-status">No matching songs yet</div>
          )}
          {!loading &&
            items.map((item, index) => (
              <button
                type="button"
                role="option"
                id={`${listId}-option-${index}`}
                aria-selected={index === active}
                className={"suggestion " + (index === active ? "active" : "")}
                key={item.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => go("/" + item.language + "/" + item.slug)}
              >
                <span className="suggestion-title">
                  <Highlight value={item.title} query={query} />
                </span>
                {item.romanTitle && (
                  <span className="suggestion-roman">
                    <Highlight value={item.romanTitle} query={query} />
                  </span>
                )}
                <span className="suggestion-meta">
                  {item.artist || "Christian song"}
                  <span> · {item.language}</span>
                </span>
                {item.snippet && (
                  <span className="suggestion-snippet">{item.snippet}</span>
                )}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
