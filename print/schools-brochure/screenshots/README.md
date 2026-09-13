# Drop App Store screenshots here

The build looks for these four names. Anything missing renders as a labelled
placeholder at the exact final size, so the layout is finished without them.

| File | Screen |
| --- | --- |
| `cast.png` | Cast, a single voice. Moses for preference (green field, "spoke with God 82 times"); Jesus works too |
| `reader.png` | The reader: a story mid-scroll, several colours visible |
| `plan.png` | Plan: the plan list, or a plan open |
| `talk-about-it.png` | Talk about it: the four questions after a story |

`.png` or `.jpg`, portrait, App Store 6.7" (1290 × 2796) ideal. Light mode.
The frame crops with `object-fit: cover`, so the very top and bottom of a tall
screenshot may be trimmed.

Then: `node print/schools-brochure/build.mjs`
