// ============================================================================
// THE ONLY PLACE STATISTICS LIVE. Edit here, rebuild, done.
//
// Figures supplied by Nathaniel from kiwibuddy.github.io/bible-resurgence,
// which states every statistic was checked against its linked source in
// July 2026 and asks that figures be re-checked before republication after
// October 2026.
//
// `source` prints on the slide. `confirm` marks a field still to be filled in
// and is listed by the build so nothing ships blank by accident.
// ============================================================================

export const STATS = {
  resurgence: {
    eyebrow: 'The turn',
    head: 'Weekly Bible reading is going <em>up</em>, and fastest among the young.',
    counters: [
      { from: 30, to: 42, suffix: '%', label: 'Read the Bible weekly', note: 'Up from 30%', confirm: 'population + years' },
      { from: 30, to: 49, suffix: '%', label: 'Gen Z reading weekly', note: 'Up from 30%', confirm: 'population + years' },
      { to: 50, suffix: '%', label: 'Millennials reading weekly', note: '', confirm: 'population + year' },
    ],
    source: 'Supplied from the Bible resurgence research compilation, July 2026',
  },

  men: {
    eyebrow: 'The surprise',
    head: 'The growth is being led by <em>young men</em>.',
    lede: 'That runs against most assumptions about who is picking the Bible up, and it is worth sitting with before you plan a single discipleship programme.',
    bars: [
      { label: 'Gen Z men', value: 54 },
      { label: 'Gen Z women', value: 46 },
      { label: 'Millennial men', value: 57 },
      { label: 'Millennial women', value: 43 },
    ],
    unit: '%',
    source: 'Bible resurgence compilation, July 2026',
    confirm: 'what the % is a share of',
  },

  uk: {
    eyebrow: 'The United Kingdom',
    head: 'A quiet revival, and the same pattern in the numbers.',
    counters: [
      { from: 8, to: 12, suffix: '%', label: 'Monthly church attendance', note: 'Up from 8%' },
      { from: 4, to: 21, suffix: '%', label: 'Young men attending monthly', note: 'Up from 4%' },
    ],
    footnote: 'Sample size 13,146.',
    source: 'Bible resurgence compilation, July 2026',
    confirm: 'survey name + years',
  },

  digital: {
    eyebrow: 'The scale of it',
    head: 'A billion installs. And almost all of it read <em>alone</em>.',
    counters: [
      { to: 1, suffix: 'bn', label: 'YouVersion installs', note: 'Lifetime' },
      { to: 22.2, suffix: 'm', decimals: 1, label: 'Users in a single day', note: '4 January 2026' },
    ],
    kicker: 'This is not a Bible access problem. Access has never been better in human history. It is a question of what we are forming when the reading is solitary.',
    source: 'YouVersion, via the Bible resurgence compilation',
  },

  ai: {
    eyebrow: 'The other thing happening',
    head: 'AI has already arrived in how people handle Scripture.',
    bars: [
      { label: 'Pastors', value: 94 },
      { label: 'Practicing Christians', value: 83 },
      { label: 'US adults', value: 74 },
      { label: 'Millennials', value: 44 },
      { label: 'Gen Z', value: 39 },
    ],
    unit: '%',
    source: 'Barna / Gloo, via the Bible resurgence compilation',
    confirm: 'what each % measures',
  },
};

// Not survey data. Kept apart on purpose.
export const REACH = {
  eyebrow: 'Not a statistic',
  head: 'And a very large number of people are watching someone argue about the Bible.',
  lede: 'These are view counts, not research. They measure appetite, not belief, and they belong in a different column from anything above.',
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
