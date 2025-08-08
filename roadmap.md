## Objective
Upgrade the formatting and style of the 66 book introductions (I001–I066) to a premium, production-ready experience aligned with the web app while following internal RN rules and best practices. Exclude any content titled or related to "Original and New Testament Relationships".

## Recon (Step-by-step)
- Audit where introduction data is loaded and rendered
  - Rendering: `app/(tabs)/[segment]/index.tsx` → `components/Bible/Intro.tsx`
  - Data: `assets/data/newBibleNLT1.json` entries `I001..I066` with unified `content/colors/sources`
  - Titles/refs: `assets/data/SegmentTitles.json`
- Review existing RN Intro renderer
  - Confirm support for: headings, paragraphs, lists, tables, links
  - Validate no inline styles and split styles: follow rules file
- Review web reference components (for parity and UX cues)
  - `Introduction2.js`, `Title.js`, `Paragraph.js`, `List.js`, `Table.js`, `BookData.js`, `RecommendedResources.js`, `BibleEffectVideo.js`, `BibleProjectVideos.js`
  - Capture design patterns (centered titles, underline accents, clear table borders, compact line-height)
- Identify constraints
  - RN tables and lists must be custom components
  - Future charts: consider RN chart libs only if strictly needed

## Plan
- Content normalization
  - Ensure intro `content` blocks render: headings, subheadings, paragraphs, bulleted/numbered lists, tables, links
  - Block highlight style support
  - Filter out any block whose heading matches "Original and New Testament Relationships"
- Componentization & styles
  - Split styles into `components/Bible/Intro.styles.ts`
  - Add `IntroList` and `IntroTable` primitives inside `Intro.tsx` for MVP
  - Preserve typography hierarchy and spacing based on app theme
- Navigation links
  - Keep link styling; route handling added later when link schema is finalized
- Accessibility & responsiveness
  - Larger hit targets, high-contrast headers, responsive max-width on tablets

## Context
- Current Intro component rendered but lacked explicit list/table handling and had inline styles. Web code shows expected content types and visual cues. Types unify intros and segments, enabling a single renderer pipeline.

## Execute (MVP implemented)
- Created `components/Bible/Intro.styles.ts` with extracted styles and improved list/table styles
- Updated `components/Bible/Intro.tsx`
  - Imported new styles and added `IntroList` and `IntroTable`
  - Rendered paragraphs, headings, lists, tables
  - Kept Start Reading CTA; retained theme usage
  - Prepared for link parsing and navigation (future)

## Verify
- Manual checks
  - Open `ENG-NLT-I066` and a few more intros; verify headings, lists, tables render; no inline styles; spacing consistent
  - Confirm no crashes on entries missing optional fields
  - Confirm tables show headers with distinct background, rows with separators
- Automated/lint
  - Linter clean on updated files

## Report (Next Steps)
- Link navigation
  - Implement `onPress` for inline links using `parseReference` + `referenceMapping.findSegmentId` to navigate to story segments
- Section filtering
  - If intro content contains a heading equal to "Original and New Testament Relationships", skip rendering that heading and its subsequent related content
- Theming polish
  - Replace static colors in table/list with theme colors from `useAppSettings()`
  - Support RTL spacing when needed (mirror bullet and number alignment)
- Charts (phase 2)
  - If charts are needed for intros, evaluate `react-native-svg` + `victory-native` or `react-native-svg-charts`
  - Scope: small doughnut/pie replacement for source role comparison
- QA sweep
  - Test iOS, Android phones/tablets, dark mode
  - Measure performance on long intros and consider virtualization if needed

## Ready for continuation?
- I can proceed with: link navigation, section filtering, theme polish, and RTL support; or prioritize chart MVP if desired.


