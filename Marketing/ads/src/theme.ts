/**
 * Mirrored from SVB-Reader/constants/Colors.ts. If the app palette changes,
 * change it there first and copy it here — these must not drift, because the
 * ads show the real product.
 */

export const light = {
  bg: '#F3F5F2',
  surf: '#FFFFFF',
  ink: '#101619',
  mute: '#5E6B70',
  hair: '#DFE5E0',
  narr: '#3A4550',
  divine: '#C0261A',
  prin: '#0E6B4C',
  chor: '#1D46A8',
  acc: '#0E6B4C',
  divFill: '#FBEDEB',
  prinFill: '#E9F4EF',
  chorFill: '#EBEFFA',
  thread: '#B4C0B8',
  cream: '#F2EAE0',
} as const;

/** The app's dark-mode source colours — re-chosen for a dark ground, not inverted. */
export const dark = {
  narr: '#AEBACB',
  divine: '#FF5A45',
  prin: '#46D9A0',
  chor: '#6BA9FF',
} as const;

export type VoiceColor = 'black' | 'red' | 'green' | 'blue';

export const INK: Record<VoiceColor, string> = {
  black: light.narr,
  red: light.divine,
  green: light.prin,
  blue: light.chor,
};

export const FILL: Record<VoiceColor, string> = {
  black: light.surf,
  red: light.divFill,
  green: light.prinFill,
  blue: light.chorFill,
};

/**
 * Which side of the reader a voice sits on. Matches utils/ink.ts isLeftVoice —
 * narration and divine speech read down one side, humanity down the other.
 * (components/Bible/Block.tsx uses a different rule but is dead code; the
 * shipping reader goes Segment -> BibleBlock -> GlowBubble -> isLeftVoice.)
 */
export const IS_LEFT: Record<VoiceColor, boolean> = {
  black: true,
  red: true,
  green: false,
  blue: false,
};

export const VOICE_LABEL: Record<VoiceColor, string> = {
  black: 'The Narrator',
  red: 'Divine speech',
  green: 'Named principals',
  blue: 'Everyone else',
};

export const SANS =
  '-apple-system, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';
export const SERIF = 'Didot, "Bodoni 72", "Hoefler Text", Georgia, serif';

/* ─────────────────────────── canvas and safe zones ─────────────────────────── */

export const W = 1080;
export const H = 1920;
export const FPS = 30;

/**
 * Meta: leave at least 14% of the top, 35% of the bottom and 6% of each side
 * free of anything important. The bottom-right action rail is taller than the
 * caption block, so treat the bottom-right as ~40%.
 *
 * A 9:16 asset is also cropped to 4:5 in the Facebook feed, which removes
 * roughly the top and bottom 15%. FEED_CROP marks what survives both.
 */
export const SAFE = {
  top: Math.round(H * 0.14), // 269
  bottom: Math.round(H * 0.35), // 672
  side: Math.round(W * 0.06), // 65
  bottomRight: Math.round(H * 0.4), // 768
} as const;

export const SAFE_BOX = {
  x: SAFE.side,
  y: SAFE.top,
  width: W - SAFE.side * 2, // 950
  height: H - SAFE.top - SAFE.bottom, // 979
} as const;

export const FEED_CROP = {
  top: Math.round(H * 0.15),
  bottom: Math.round(H * 0.15),
} as const;

/** Vertical centre of the safe box — where a hook line should sit. */
export const SAFE_MID_Y = SAFE_BOX.y + SAFE_BOX.height / 2;
