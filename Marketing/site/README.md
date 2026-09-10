# Landing page and guides

No build step, no dependencies, no framework — open `index.html` and it works.

| File | What it is |
| --- | --- |
| `index.html` | The landing page. Where the eight Meta ads point |
| `leader-guide-schools.html` | Long-form guide for schools, chapel and youth groups |
| `styles.css` | Shared by both |
| `doc.css` | Extras the long-form guide needs and the landing page does not |
| `app.js` | Shared. The passage demo is skipped on pages that have no demo |

The printable one-page flyers live in `../print` — one for schools and youth
groups, one for YWAM Discipleship Training Schools.

```bash
cd Marketing/site
python3 -m http.server 8899 --bind 127.0.0.1   # then http://127.0.0.1:8899
```

Deploy by dropping the folder on any static host (Vercel, Netlify, GitHub Pages,
Cloudflare Pages). Nothing here needs a server.

## What it is for

This is where the eight Meta ads land. An ad earns about two seconds of
attention, so the page has one job above the fold: show the thing the ad
promised, immediately.

That is why the demo is the hero rather than a screenshot. The passage starts as
undifferentiated prose, switches itself to the app's own colouring after a
moment, and then lets the visitor **take a colour** and watch everything that is
not theirs recede — the single interaction the whole product rests on. Someone
who touches that has understood the app without installing it.

The Genesis 3 text and its attribution are lifted verbatim from
`assets/data/newBibleNLT1.json` via `Marketing/ads/scripts/dump-segment.mjs`. The
colours come from `constants/Colors.ts` by way of `Marketing/ads/src/theme.ts`.
Someone arriving from an ad sees the same four colours they just watched.

## Before it goes live

- **Store links.** The two buttons in `#get` and the header CTA point at `#`.
  Replace with the real App Store and Google Play URLs, and swap the text
  buttons for the official badge artwork — both stores require their own artwork
  and neither permits a text imitation of it.
- **`og:image`.** Currently the app icon, which crops badly in a link preview.
  Render a 1200 × 630 card instead.
- **Flyer links.** `#groups` links to the two flyers as HTML in `../print`.
  Point them at the PDFs, or wherever they end up hosted.
- **Analytics.** There is none. If you add any, keep it cookieless — the page
  claims no data collection two sections further down, and the page should not
  contradict itself.

## Claims

Every figure on this page is in `Marketing/print/SOURCES.md`, along with the
list of things that must never appear in a public asset. The "What it doesn't
do" section is deliberate: it is cheaper to lose an install here than to earn a
one-star review from someone who expected audio.
