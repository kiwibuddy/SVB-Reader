/**
 * Thread palette. Light is the shipped default; dark is a designed second mode.
 * Voice ink: narrator, divine, named principals, everyone else.
 */

export const ThreadColors = {
  light: {
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
    // Momentary wash on the turn a verse reference lands on. Warm, so it reads
    // against all four bubble fills, and distinct from acc, which means active.
    find: '#FCEFC0',
  },
  dark: {
    bg: '#080D13',
    surf: '#121B25',
    ink: '#E9EDF2',
    mute: '#7A8798',
    hair: '#1E2833',
    narr: '#AEBACB',
    divine: '#FF5A45',
    prin: '#46D9A0',
    chor: '#6BA9FF',
    acc: '#46D9A0',
    divFill: '#251217',
    prinFill: '#0D2620',
    chorFill: '#111C31',
    thread: '#2C3742',
    find: '#3D3418',
  },
} as const;

export type ThreadPalette = { [K in keyof typeof ThreadColors.light]: string };

export function inkHex(color: string, palette: ThreadPalette): string {
  switch (color) {
    case 'red':
      return palette.divine;
    case 'green':
      return palette.prin;
    case 'blue':
      return palette.chor;
    default:
      return palette.narr;
  }
}

export function fillHex(color: string, palette: ThreadPalette): string {
  switch (color) {
    case 'red':
      return palette.divFill;
    case 'green':
      return palette.prinFill;
    case 'blue':
      return palette.chorFill;
    default:
      return palette.surf;
  }
}

const tintColorLight = '#0E6B4C';
const tintColorDark = '#46D9A0';

export const Colors = {
  light: {
    text: ThreadColors.light.ink,
    background: ThreadColors.light.bg,
    tint: tintColorLight,
    icon: ThreadColors.light.mute,
    tabIconDefault: ThreadColors.light.mute,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: ThreadColors.dark.ink,
    background: ThreadColors.dark.bg,
    tint: tintColorDark,
    icon: ThreadColors.dark.mute,
    tabIconDefault: ThreadColors.dark.mute,
    tabIconSelected: tintColorDark,
  },
};
