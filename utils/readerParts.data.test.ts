/**
 * The rule against the real Bible data, run through the same pipeline the
 * reader uses. Guards the shipped `readers` arrays as much as the code: if a
 * story ever stores four parts that cannot all be given a turn, this fails.
 */
import bible from '@/assets/data/newBibleNLT1.json';
import { splitIntoParagraphs } from '@/scripts/splitIntoParagraphs';
import { normalizeBibleContent } from '@/utils/normalizeBibleContent';
import { assignReaders, readerSlots, NO_READER } from '@/utils/readerParts';

const stories = bible as Record<string, any>;

function render(id: string) {
  const story = stories[id];
  const blocks = normalizeBibleContent(splitIntoParagraphs(story.content));
  const slots = readerSlots(story.readers, story.colors);
  return { story, blocks, slots, assigned: assignReaders(blocks, slots) };
}

test('S347 gives four grey boxes and every 4th bubble', () => {
  const { slots, assigned } = render('S347');
  expect(slots.map((s) => s.ink)).toEqual(['black', 'black', 'black', 'black']);
  expect(assigned.slice(0, 8)).toEqual([0, 1, 2, 3, 0, 1, 2, 3]);
  expect([0, 1, 2, 3].map((r) => assigned.filter((a) => a === r).length)).toEqual([10, 9, 9, 9]);
});

test('every story yields four parts, all of them used', () => {
  const ids = Object.keys(stories).filter((k) => k.startsWith('S'));
  expect(ids).toHaveLength(365);
  const unused: string[] = [];
  for (const id of ids) {
    const { slots, assigned } = render(id);
    expect(slots).toHaveLength(4);
    const spoken = assigned.filter((a) => a !== NO_READER);
    expect(spoken.length).toBeGreaterThan(0);
    const used = new Set(spoken);
    if (used.size !== 4) unused.push(`${id} used ${used.size} of 4`);
  }
  expect(unused).toEqual([]);
});

test('editorial rows are unread; psalm headings are read', () => {
  const { blocks, assigned } = render('S088');
  const editorial = blocks
    .map((b, i) => ({ kind: b.source?.kind, r: assigned[i] }))
    .filter((x) => x.kind === 'editorial');
  expect(editorial.length).toBeGreaterThan(0);
  for (const e of editorial) expect(e.r).toBe(NO_READER);

  const psalms = render('S162');
  const titles = psalms.blocks
    .map((b, i) => ({ kind: b.source?.kind, r: psalms.assigned[i] }))
    .filter((x) => x.kind === 'title');
  expect(titles.length).toBeGreaterThan(0);
  for (const t of titles) expect(t.r).not.toBe(NO_READER);
});

test('each reader gets a fair share of the turns', () => {
  const ids = Object.keys(stories).filter((k) => k.startsWith('S'));
  const worst: string[] = [];
  for (const id of ids) {
    const { assigned } = render(id);
    const spoken = assigned.filter((a) => a !== NO_READER);
    const counts = [0, 1, 2, 3].map((r) => spoken.filter((a) => a === r).length);
    if (Math.min(...counts) === 0) worst.push(`${id}: ${counts.join('/')}`);
  }
  expect(worst).toEqual([]);
});
