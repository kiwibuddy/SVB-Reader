import type { VoiceColor } from '../theme';

export type Line = {
  speaker: string;
  color: VoiceColor;
  text: string;
};

/**
 * Story S002, Genesis 3:9–13, lifted verbatim from assets/data/newBibleNLT1.json
 * via scripts/dump-segment.mjs. Speaker and colour are the app's own attribution.
 * Do not edit by hand — re-run the dump if this needs to change.
 */
export const GEN3: Line[] = [
  { speaker: 'The Narrator', color: 'black', text: 'Then the Lord God called to the man,' },
  { speaker: 'God', color: 'red', text: '“Where are you?”' },
  {
    speaker: 'Adam',
    color: 'blue',
    text: '“I heard you walking in the garden, so I hid. I was afraid because I was naked.”',
  },
  { speaker: 'God', color: 'red', text: '“Who told you that you were naked?”' },
  {
    speaker: 'Adam',
    color: 'blue',
    text: '“It was the woman you gave me who gave me the fruit, and I ate it.”',
  },
  { speaker: 'God', color: 'red', text: '“What have you done?”' },
  { speaker: 'Eve', color: 'blue', text: '“The serpent deceived me,”' },
];

/** The same passage set as undifferentiated prose, for the opening beat. */
export const GEN3_WALL =
  'Then the Lord God called to the man, “Where are you?” He replied, “I heard you walking in the garden, so I hid. I was afraid because I was naked.” “Who told you that you were naked?” the Lord God asked. “Have you eaten from the tree whose fruit I commanded you not to eat?” The man replied, “It was the woman you gave me who gave me the fruit, and I ate it.” Then the Lord God asked the woman, “What have you done?” “The serpent deceived me,” she replied. “That’s why I ate it.”';
