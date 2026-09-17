// ============================================================================
// THE ONLY PLACE STATISTICS LIVE. Edit here, rebuild, done.
//
// Figures supplied by Nathaniel from kiwibuddy.github.io/bible-resurgence,
// which states every statistic was checked against its linked source in
// July 2026 and asks that figures be re-checked before republication after
// October 2026.
//
// `source` prints on the slide. `modal` is what opens when a stat card is
// clicked, and it must carry the exact source string, not a paraphrase.
// `confirm` marks a field still to be filled in and is listed by the build so
// nothing ships blank by accident.
// ============================================================================

const RECHECK = 'Checked against its linked source in July 2026. The compilation ' +
  'asks that figures be re-checked before republication after October 2026.';

export const COMPILATION = {
  short: 'Bible resurgence compilation, July 2026',
  full: 'Bible resurgence research compilation, kiwibuddy.github.io/bible-resurgence, July 2026',
  link: 'https://kiwibuddy.github.io/bible-resurgence/',
};

export const STATS = {
  resurgence: {
    eyebrow: 'Movement 1 · the numbers',
    head: 'Bible reading is going up, and the sharpest rise is among the youngest.',
    counters: [
      { id: 'r1', from: 30, to: 42, suffix: '%', label: 'read the Bible weekly', note: 'Up from 30%',
        confirm: 'population + years',
        modal: { title: 'Weekly Bible reading, 30% to 42%',
          body: 'A rise in the share reporting they read the Bible at least weekly. The population and the two survey years still need pinning down before this goes on a slide anywhere else.' } },
      { id: 'r2', from: 30, to: 49, suffix: '%', label: 'Gen Z reading weekly', note: 'Up from 30%',
        confirm: 'population + years',
        modal: { title: 'Gen Z weekly reading, 30% to 49%',
          body: 'The steepest movement in the compilation. Same open question: which population, and across which two years.' } },
      { id: 'r3', from: 4, to: 21, suffix: '%', label: 'UK young men at church monthly', note: 'Up from 4%',
        confirm: 'survey name + years',
        modal: { title: 'UK young men attending monthly, 4% to 21%',
          body: 'This one counts attendance rather than self-reported reading, which is why it is here beside the reading figures rather than on its own. Sample size 13,146. Survey name and the two years are still to be confirmed.' } },
    ],
    source: COMPILATION.short + '. Reading figures and UK attendance are separate surveys.',
  },

  // CUT from the deck. A 54/46 split does not carry "young men are driving
  // this", and the AI percentages have no stated denominator yet. Both are one
  // slide away from returning once the methodology is pinned down.
  men: {
    eyebrow: 'Movement 1 · who is driving it',
    head: 'It is young men, which is not what anyone predicted.',
    lede: 'Sit with that one for a second before you plan another discipleship programme. Most of what we build assumes the opposite.',
    bars: [
      { label: 'Gen Z men', value: 54 },
      { label: 'Gen Z women', value: 46 },
      { label: 'Millennial men', value: 57 },
      { label: 'Millennial women', value: 43 },
    ],
    unit: '%',
    source: COMPILATION.short,
    confirm: 'what the % is a share of',
  },

  uk: {
    eyebrow: 'Movement 1 · the United Kingdom',
    head: 'Same shape in the UK, and this one counts attendance rather than what people say about themselves.',
    counters: [
      { id: 'u1', from: 8, to: 12, suffix: '%', label: 'monthly church attendance', note: 'Up from 8%',
        modal: { title: 'Monthly church attendance, 8% to 12%',
          body: 'Attendance rather than self-reported reading, which is why it carries more weight than the reading figures. Survey name and the two years are still to be confirmed.' } },
      { id: 'u2', from: 4, to: 21, suffix: '%', label: 'young men attending monthly', note: 'Up from 4%',
        modal: { title: 'Young men attending monthly, 4% to 21%',
          body: 'The same age and gender pattern as the reading figures, on a different measure and in a different country. Survey name and years still to be confirmed.' } },
    ],
    footnote: 'Sample size 13,146.',
    source: COMPILATION.short,
    confirm: 'survey name + years',
  },

  digital: {
    eyebrow: 'Movement 2 · the scale of it',
    head: 'A billion installs of one Bible app.',
    counters: [
      { id: 'd1', to: 1, suffix: 'bn', label: 'YouVersion installs', note: 'Lifetime',
        modal: { title: 'YouVersion, one billion installs',
          body: 'Lifetime installs of a single free Bible app. Whatever the problem is now, it is not that people cannot reach the text.' } },
      { id: 'd2', to: 22.2, suffix: 'm', decimals: 1, label: 'users in a single day', note: '4 January 2026',
        modal: { title: '22.2 million users on one day',
          body: 'A single-day figure from 4 January 2026, which is the January reading-plan spike. It is the clearest number in the set for how normal a phone Bible has become.' } },
    ],
    kicker: 'So access is not the problem. Access has never been better in the history of the world. The question is what we are forming while all of that reading happens on our own.',
    source: 'YouVersion, via the ' + COMPILATION.short,
  },

  ai: {
    eyebrow: 'Movement 1 · the other thing happening',
    head: 'AI has already arrived in how people handle Scripture.',
    bars: [
      { label: 'Pastors', value: 94 },
      { label: 'Practicing Christians', value: 83 },
      { label: 'US adults', value: 74 },
      { label: 'Millennials', value: 44 },
      { label: 'Gen Z', value: 39 },
    ],
    unit: '%',
    source: 'Barna / Gloo, via the ' + COMPILATION.short,
    confirm: 'what each % measures',
  },
};

// Not survey data. Kept apart on purpose.
export const REACH = {
  eyebrow: 'Movement 1 · not a statistic',
  head: 'And millions of people are sitting through three hour podcasts about whether the Bible is true.',
  lede: 'These are view counts. They measure appetite, not belief, and I am keeping them in a different column from everything above.',
  items: [
    'Joe Rogan with Wesley Huff',
    'Diary of a CEO with Wesley Huff',
    'Jordan Peterson on the biblical text',
    'Shawn Ryan with Lee Strobel',
    'Shawn Ryan with Lee Strobel and John Burke',
    'Jeremiah Johnston',
  ],
  confirm: 'view counts for each',
};

export const TRANSLATION = {
  head: 'Translation is moving too.',
  items: [
    { n: 'up to 50%', l: 'faster translation work with AI assistance', s: 'Wycliffe' },
    { n: '~80', l: 'concurrent translation projects', s: 'Wycliffe / illumiNations' },
    { n: '2013', l: 'where AI-assisted translation starts', s: 'Wycliffe' },
  ],
  confirm: 'exact Wycliffe / illumiNations citations',
};

// Every counter that carries a modal, flattened for the runtime's SOURCES map.
export function sourceMap() {
  const out = {};
  for (const block of Object.values(STATS)) {
    for (const c of block.counters || []) {
      if (!c.modal) continue;
      out[c.id] = {
        stat: (c.decimals ? c.to.toFixed(c.decimals) : c.to) + (c.suffix || ''),
        title: c.modal.title,
        body: c.modal.body + '\n\n' + RECHECK,
        source: block.source,
        link: COMPILATION.link,
      };
    }
  }
  return out;
}
