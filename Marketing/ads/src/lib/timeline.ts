/** Shared beat map for every ad in the set. See SCRIPTS.md. */
export const T = {
  TITLE_HOLD: 48,
  MORPH_END: 76,
  HOOK_1: 80,
  HOOK_2: 108,
  PHONE_IN: 166,
  PHONE_OUT: 420,
  CTA: 440,
  TOTAL: 580,
} as const;

/** First spoken/animated beat inside the device, once it has settled. */
export const SCREEN_START = T.PHONE_IN + 28;
