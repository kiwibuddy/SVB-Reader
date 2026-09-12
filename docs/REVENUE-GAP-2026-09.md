# Revenue gap: a shipped app with no payment path
### 2026-09-12 · finding from the cross-repo AI engagement and scaling review

Full analysis: `sphere-worldview-corpus/planning/ai-engagement-scaling-strategy.md`

## The finding

SourceView Together is at v1.3.0. It launched August 2025 at All Saints Cathedral,
Nairobi. It carries 365 narrative stories, 774 attributed voices, four source colours,
reading plans, discussion questions and a complete French localisation.

`MONETIZATION_IMPLEMENTATION_GUIDE.md` specifies the tiers in detail: Enhanced Stories
at $1.99, Reading Plans Plus and Premium, Questions Plus, a Complete Plus bundle at
$2.99, a Complete Premium bundle at $4.99, and a 20% annual discount.

There is no purchase code in the repository. No `react-native-iap`, no
`expo-in-app-purchases`, no RevenueCat, nothing. The app is in people's hands and
there is no way for any of them to pay.

This is the sharpest single instance of the pattern the cross-repo review found:
production is saturated, conversion is empty.

## Two routes, and the second is probably the real one

**App store tiers.** Implement the existing spec. The work is bounded because the
pricing, the feature split and the bundles were decided months ago. Nothing needs to
be designed, only built.

**Licensing the format.** Likely the larger number. The Kenya follow-ups project is
already in conversation with AMA about their radio and television schedule while it
is being built, with the Bible reading format named as one of four content proposals,
and St Augustine as a pilot site. A broadcaster licensing the four-colour group reading
format is a different revenue shape from 365 individual $1.99 purchases, and it does
not depend on app-store discovery, which this app has never had.

The French localisation matters more for route two than route one.

## What would move it

1. Decide which route is primary before building either. They imply different next steps.
2. If app store: implement the existing spec as written. No redesign.
3. If licensing: the Kenya AMA Zoom is the gate, and it is already the next action on that project.
4. Either way, the app currently has no capture of who is reading it. That is the same seam found across the other two repositories.

## Not a blocker

The 365 stories are Nathaniel's solo build with David Hamilton's go-ahead, and David
is not a co-builder of this app. The David product flag register applies to the 416
devotion corpus, not to SourceView Together.
