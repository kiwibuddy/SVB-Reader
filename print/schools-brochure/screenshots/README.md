# App Store screenshots

All four are present. To replace one, drop a new file over the old name and re-run
`node print/schools-brochure/build.mjs`.

| File | Screen |
| --- | --- |
| `cast.png` | Cast, a single voice. Currently Moses |
| `reader.png` | The reader: a story mid-scroll, several colours visible |
| `plan.png` | Plan: the plan list |
| `talk-about-it.png` | The four questions at the end of a story |

`.png` or `.jpg`, portrait, light mode. 1170 x 2532 or 1290 x 2796 both work; the
frame clips with `object-fit: cover` from the top.

`talk-about-it.png` is not the raw capture. Its top 8.5 per cent was replaced with
a flat `#F3F5F2` strip because the reading screen has no status-bar background and
the clock rendered on top of scripture. See the main README.
