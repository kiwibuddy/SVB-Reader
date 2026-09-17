// ============================================================================
// THE ONLY PLACE STATISTICS LIVE. Edit here, rebuild, done.
//
// Every figure on a slide carries its own primary source and a working link to
// the publisher's own page. When a stat card is clicked, its `modal` opens with
// a short, public-facing explanation, the source, and that link. Nothing here
// is written for the presenter: it is all for a reader who taps the card.
//
// Sourcing pass, September 2026:
//   r1 / r2 / r3  Barna Group and Gloo, State of the Church, November 2025
//   d1 / d2       YouVersion (Life.Church), October 2025 and January 2026
// The UK "Quiet Revival" young-men figure that used to sit here was withdrawn
// by Bible Society in March 2026 after YouGov found the 2024 sample unreliable,
// so it has been removed and replaced with the Millennials figure from the same
// Barna and Gloo study the other two reading numbers come from.
// ============================================================================

const BARNA = {
  source: 'Barna Group and Gloo, State of the Church, November 2025',
  link: 'https://www.barna.com/trends/bible-reading-trends/',
};

export const STATS = {
  resurgence: {
    eyebrow: 'Movement 1 · where we are',
    head: 'Bible engagement is rising, especially among younger people.',
    counters: [
      { id: 'r1', from: 30, to: 42, suffix: '%', label: 'read the Bible weekly', note: 'Up from 30%',
        modal: {
          title: 'Weekly Bible reading, 30% to 42%',
          body: 'In 2025, 42% of US adults said they read the Bible at least once a week, up from 30% in 2024, which was the lowest level in fifteen years. Younger adults led the rebound.',
          source: BARNA.source, link: BARNA.link } },
      { id: 'r2', from: 30, to: 49, suffix: '%', label: 'Gen Z reading weekly', note: 'Up from 30%',
        modal: {
          title: 'Gen Z weekly Bible reading, 30% to 49%',
          body: 'Weekly Bible reading among Gen Z rose from 30% to 49% in a single year, a 19 point jump and the largest of any generation in the study.',
          source: BARNA.source, link: BARNA.link } },
      { id: 'r3', from: 34, to: 50, suffix: '%', label: 'Millennials reading weekly', note: 'Up 16 points',
        modal: {
          title: 'Millennial weekly Bible reading, 34% to 50%',
          body: 'Millennials rose 16 points in a single year to 50% reading weekly, the largest one-year increase the study recorded for that generation.',
          source: BARNA.source, link: BARNA.link } },
    ],
    source: 'Barna Group and Gloo · State of the Church · November 2025',
  },

  digital: {
    eyebrow: 'Movement 1 · access is not the issue',
    head: 'Access to Scripture has never been easier.',
    counters: [
      { id: 'd1', to: 1, suffix: 'bn', label: 'YouVersion installs', note: 'Since 2008',
        modal: {
          title: 'YouVersion, one billion installs',
          body: 'In October 2025 YouVersion’s Bible App passed one billion installs since it launched in 2008. It is now available in more than 2,300 languages.',
          source: 'YouVersion (Life.Church), October 2025',
          link: 'https://www.youversion.com/news/bible-app-reaches-one-billion-installs' } },
      { id: 'd2', to: 22.2, suffix: 'm', decimals: 1, label: 'users in a single day', note: '4 January 2026',
        modal: {
          title: '22.2 million in a single day',
          body: 'On Sunday 4 January 2026, more than 22.2 million people used YouVersion’s apps and website in one day, its highest day of engagement on record, during the New Year reading-plan surge.',
          source: 'YouVersion (Life.Church), January 2026',
          link: 'https://www.youversion.com/news/record-breaking-millions-turn-to-scripture-in-the-new-year' } },
    ],
    kicker: 'A billion installs. Millions opening the Bible in a single day. More access to Scripture than any generation before us. So the question becomes: what practices help students encounter God through His Word, together?',
    source: 'YouVersion (Life.Church) · 2025 to 2026',
  },
};

// Every counter that carries a modal, flattened for the runtime's SOURCES map.
// Each modal ships its own source and link, so the reader who taps a card gets
// the publisher and a way to check the number themselves.
export function sourceMap() {
  const out = {};
  for (const block of Object.values(STATS)) {
    for (const c of block.counters || []) {
      if (!c.modal) continue;
      out[c.id] = {
        stat: (c.decimals ? c.to.toFixed(c.decimals) : c.to) + (c.suffix || ''),
        title: c.modal.title,
        body: c.modal.body,
        source: c.modal.source,
        link: c.modal.link,
      };
    }
  }
  return out;
}
