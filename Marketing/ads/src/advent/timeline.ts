/** Beat map for the two 30-second Advent ads. See ADVENT.md. */
export const AT = {
  TITLE_HOLD: 48,
  MORPH_END: 76,
  HOOK_1: 80,
  HOOK_2: 112,
  PHONE_IN: 178,
  SWAP: 440,
  STATEMENT: 666,
  PHONE_OUT: 712,
  CTA: 780,
  TOTAL: 900,
} as const;

/** First animated beat on each screen, once the device or the swap has settled. */
export const A_START = AT.PHONE_IN + 30;
export const B_START = AT.SWAP + 20;

/** Advent week colours, as used in the app's plan (ChronologicalMappings.json). */
export const ADVENT = {
  purple: '#6A4C93',
  fill: '#F1EDF6',
  hope: '#6A4C93',
  peace: '#3F6FB5',
  joy: '#C2507A',
  love: '#8E3FA0',
} as const;
