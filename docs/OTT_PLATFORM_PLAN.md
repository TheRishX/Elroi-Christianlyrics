# Elroi OTT: cinematic streaming experience

## Viewer journey

Visitors enter through a short gold cross portal from Elroi Lyrics. The public OTT shell uses charcoal, forest olive, antique gold, warm cream, and sage. Home opens with a full-width featured carousel. Curators can rank up to ten featured stories; when fewer are available, the newest non-Reel stories fill the remaining slots. The carousel advances every seven seconds, supports arrows, swipe, keyboard arrows, a pause button, and reduced-motion preferences.

English, Nepali, and Hindi stories browse together. There is no language welcome or persistent language picker. The top-right search icon opens the dedicated full-width search experience; search contains optional language, category, and story-type filters. Explore browses category collections without a filter form. Each category row offers See all. Continue Watching and My List appear before category rows when the guest has local data. Reels and the watch detail/player share the same dark visual system.

With no published stories, the public home presents an editorial coming-soon composition, while Explore, Reels, Search, and My List show relevant empty states. Preview or invented video cards are never shown as playable content.

## Navigation and design tokens

The desktop header provides Return to Elroi Lyrics, Elroi OTT, Home, Explore, Reels, My List, and the search icon at the far right. Mobile keeps the five-tab bottom bar: Home, Explore, Reels, My List, More. More includes the lyrics return link and clear-local-data action.

| Token | Value | Use |
| --- | --- | --- |
| Ink | `#090d09` | Page base |
| Forest | `#111a12` | Deep surfaces |
| Panel | `#1a251b` | Cards and sheets |
| Raised olive | `#263529` | Image fallbacks |
| Olive | `#77895c` | Quiet accents |
| Antique gold | `#dbb769` | Actions, focus, active states |
| Cream | `#fffaf0` | Primary text |
| Sage | `#b8c8ad` | Secondary text |

## Curation and backend

`/studio` is the curator-facing OTT editor; `/ott/settings` redirects there. It shares the signed admin session with `/uploads`. Curators create categories, paste public YouTube links, fetch/verify source metadata, add an Elroi display title and synopsis, choose language and type, mark featured or Reel, rank the hero, and publish or save drafts. The existing WordPress `elroi_video` records and REST APIs remain canonical; OTT mutations revalidate affected routes. Metadata verification uses the YouTube Data API when `YOUTUBE_API_KEY` is configured and falls back to server-side oEmbed for title, channel, and thumbnail discovery. Studio includes a protected **Import 20-story launch collection** action that creates six editorial categories and a curated English, Nepali, and Hindi starter catalogue. It is idempotent, skips duplicate YouTube IDs, and uses the same publish contract as manual curation.

YouTube playback uses the privacy-enhanced embed within an Elroi watch page. My List, history, and progress stay in versioned guest-local browser storage. No account is required.

## Acceptance checks

Verify empty, one-story, five-story, and ten-story states; hero ranking, controls, swipe, keyboard, pause and reduced motion; category rows and See all routing; search across three languages; mobile safe areas; unavailable video state; and publication visibility after Studio changes. Run TypeScript, tests, and a production build. Check active OTT styles for old purple, violet, and light overrides.
