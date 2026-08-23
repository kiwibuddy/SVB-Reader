import type { BibleBlock } from '@/types';
import { NO_READER, assignReaders, readerSlots } from '@/utils/readerParts';

/** A speech bubble of one ink. */
const turn = (color: string, kind?: 'editorial' | 'title'): BibleBlock =>
  ({ children: [], source: { color, sourceName: 'Someone', ...(kind ? { kind } : {}) } } as BibleBlock);

const inks = (readers?: string[], colorData?: Record<string, number>) =>
  readerSlots(readers, colorData).map((slot) => slot.ink);

describe('readerSlots', () => {
  it('gives a narration-only story four grey parts', () => {
    // S347, "Better than Angels" — one voice, still read by four people.
    expect(inks(['black', 'black', 'black', 'black'])).toEqual(['black', 'black', 'black', 'black']);
  });

  it('keeps the classic four-colour story as it was', () => {
    expect(inks(['black', 'red', 'green', 'blue'])).toEqual(['black', 'red', 'green', 'blue']);
  });

  it('groups repeated inks together and keeps the narrator on the left', () => {
    // 13 stories store this interleaved.
    expect(inks(['black', 'green', 'blue', 'black'])).toEqual(['black', 'black', 'green', 'blue']);
  });

  it('numbers the slots by their place on screen', () => {
    expect(readerSlots(['black', 'green', 'blue', 'black'])).toEqual([
      { index: 0, ink: 'black' },
      { index: 1, ink: 'black' },
      { index: 2, ink: 'green' },
      { index: 3, ink: 'blue' },
    ]);
  });

  it('always returns four parts, whatever the story stored', () => {
    for (const readers of [undefined, [], ['black'], ['black', 'red', 'green', 'blue', 'red'], ['puce']]) {
      expect(readerSlots(readers, { black: 900, red: 100 })).toHaveLength(4);
    }
  });

  it('falls back to word counts, giving every voice that speaks a part', () => {
    expect(inks(undefined, { black: 900, red: 100 })).toEqual(['black', 'black', 'black', 'red']);
    expect(inks(undefined, { black: 500, red: 300, green: 200 }).filter((i) => i === 'red')).toHaveLength(1);
    expect(new Set(inks(undefined, { black: 1, red: 1, green: 1, blue: 1 }))).toEqual(
      new Set(['black', 'red', 'green', 'blue'])
    );
  });

  it('falls back to narration when nothing speaks at all', () => {
    expect(inks(undefined, {})).toEqual(['black', 'black', 'black', 'black']);
  });
});

describe('assignReaders', () => {
  it('deals four grey parts one bubble each, in turn', () => {
    const slots = readerSlots(['black', 'black', 'black', 'black']);
    const blocks = Array.from({ length: 9 }, () => turn('black'));
    expect(assignReaders(blocks, slots)).toEqual([0, 1, 2, 3, 0, 1, 2, 3, 0]);
  });

  it('splits 37 bubbles across four readers as evenly as they divide', () => {
    // S347's real shape: reader 1 takes the spare bubble.
    const slots = readerSlots(['black', 'black', 'black', 'black']);
    const assigned = assignReaders(Array.from({ length: 37 }, () => turn('black')), slots);
    expect([0, 1, 2, 3].map((r) => assigned.filter((a) => a === r).length)).toEqual([10, 9, 9, 9]);
  });

  it('sends every bubble of an ink to its one reader when colours are unique', () => {
    const slots = readerSlots(['black', 'red', 'green', 'blue']);
    const blocks = [turn('black'), turn('red'), turn('black'), turn('blue'), turn('green')];
    expect(assignReaders(blocks, slots)).toEqual([0, 1, 0, 3, 2]);
  });

  it('alternates only the ink that several readers share', () => {
    // ['black','red','red','red'] — narration to one reader, God shared by three.
    const slots = readerSlots(['black', 'red', 'red', 'red']);
    const blocks = [turn('black'), turn('red'), turn('red'), turn('black'), turn('red'), turn('red')];
    expect(assignReaders(blocks, slots)).toEqual([0, 1, 2, 0, 3, 1]);
  });

  it('counts each ink independently, so one voice cannot skew another', () => {
    const slots = readerSlots(['black', 'black', 'red', 'blue']);
    const blocks = [turn('black'), turn('red'), turn('black'), turn('red'), turn('black')];
    expect(assignReaders(blocks, slots)).toEqual([0, 2, 1, 2, 0]);
  });

  it('leaves editorial rows unread without spending a turn on them', () => {
    const slots = readerSlots(['black', 'black', 'black', 'black']);
    const blocks = [turn('black'), turn('black', 'editorial'), turn('black'), turn('black')];
    // Without the skip, the bracketed note would take reader 2's turn and
    // shift the rest of the story by one for good.
    expect(assignReaders(blocks, slots)).toEqual([0, NO_READER, 1, 2]);
  });

  it('reads psalm headings aloud like any other turn', () => {
    const slots = readerSlots(['black', 'black', 'black', 'black']);
    const blocks = [turn('black', 'title'), turn('black'), turn('black')];
    expect(assignReaders(blocks, slots)).toEqual([0, 1, 2]);
  });

  it('hands an uncast ink to the first reader rather than to nobody', () => {
    const slots = readerSlots(['black', 'black', 'black', 'black']);
    expect(assignReaders([turn('green')], slots)).toEqual([0]);
  });

  it('treats a missing or unknown colour as narration', () => {
    const slots = readerSlots(['black', 'red', 'green', 'blue']);
    const blocks = [{ children: [] } as BibleBlock, turn('puce')];
    expect(assignReaders(blocks, slots)).toEqual([0, 0]);
  });
});
