import Link from "next/link";
import { Icon } from "./Icon";
export function LanguageCards() {
  return (
    <div className="language-grid">
      {[
        {
          id: "hindi",
          script: "हिन्दी",
          name: "Hindi",
          caption: "Devanagari & Hinglish",
        },
        {
          id: "nepali",
          script: "नेपाली",
          name: "Nepali",
          caption: "Devanagari & Roman",
        },
        {
          id: "english",
          script: "Aa",
          name: "English",
          caption: "Words for your worship",
        },
      ].map((l) => (
        <Link href={`/${l.id}`} className={`language-card ${l.id}`} key={l.id}>
          <span
            className="script-mark"
            lang={l.id === "hindi" ? "hi" : l.id === "nepali" ? "ne" : "en"}
          >
            {l.script}
          </span>
          <div>
            <h3>{l.name}</h3>
            <p>{l.caption}</p>
          </div>
          <span className="language-arrow">
            <Icon name="arrow" />
          </span>
        </Link>
      ))}
    </div>
  );
}
