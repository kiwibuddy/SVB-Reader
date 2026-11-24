import bible from '@/assets/data/newBibleNLT1.json';
import planCompanion from '@/assets/data/PlanCompanion.json';
import fixture from '@/utils/__fixtures__/planCompanion.fixture.json';
import { keyVerseSpans, parseKeyVerseRef } from '@/utils/keyVerse';
import {
  companionCardColour,
  getCompanionDay,
  weekColour,
} from '@/utils/planCompanion';
import { contrastRatio } from '@/utils/contrast';
import { findCatalogItem } from '@/utils/planCatalog';

type BibleFile = Record<string, { content?: any[] }>;
const BIBLE = bible as unknown as BibleFile;
const REAL = planCompanion as Record<string, any>;

describe('getCompanionDay', () => {
  test('resolves Advent day 3 (S006) from the fixture', () => {
    const day = getCompanionDay('adventJourneyChronological', 'S006', 'en', fixture as any);
    expect(day).not.toBeNull();
    expect(day!.day).toBe(3);
    expect(day!.storyId).toBe('S006');
    expect(day!.keyVerses).toEqual(['Gen-15-5']);
    expect(day!.questions.family).toHaveLength(4);
    expect(day!.antiphon).toBeNull();
  });

  test('accepts an explicit 0-based day index', () => {
    const day = getCompanionDay('adventJourneyChronological', 'S006', 'en', fixture as any, 2);
    expect(day?.day).toBe(3);
  });

  test('Bible in 1 year returns null', () => {
    expect(getCompanionDay('bibleIn1Year', 'S006', 'en', fixture as any)).toBeNull();
  });

  test('empty PlanCompanion data returns null for Advent', () => {
    expect(getCompanionDay('adventJourneyChronological', 'S006', 'en', {})).toBeNull();
  });

  test('French without French text returns null', () => {
    expect(getCompanionDay('adventJourneyChronological', 'S006', 'fr', fixture as any)).toBeNull();
  });
});

describe('week colours', () => {
  test('Hope, Peace, Joy and Love match the Advent phases', () => {
    expect(weekColour('adventJourneyChronological', 0)).toBe('#6A4C93');
    expect(weekColour('adventJourneyChronological', 7)).toBe('#3F6FB5');
    expect(weekColour('adventJourneyChronological', 14)).toBe('#C2507A');
    expect(weekColour('adventJourneyChronological', 21)).toBe('#8E3FA0');
  });

  test('card fill keeps white text above 4.5:1 on every week colour', () => {
    for (const colour of ['#6A4C93', '#3F6FB5', '#C2507A', '#8E3FA0']) {
      const fill = companionCardColour(colour);
      expect(contrastRatio(fill, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('keyVerseSpans', () => {
  test('Gen 15:5 spans narrator then God', () => {
    const spans = keyVerseSpans(BIBLE.S006?.content, 'Gen-15-5');
    expect(spans.length).toBeGreaterThanOrEqual(2);
    const colours = spans.map((s) => s.colour);
    expect(colours).toContain('black');
    expect(colours).toContain('red');
    const joined = spans.map((s) => s.text).join(' ');
    expect(joined.toLowerCase()).toContain('look up into the sky');
  });

  test('Isa 52:7 has no run-together "mountainsare" in the joined span text', () => {
    const spans = keyVerseSpans(BIBLE.S202?.content, 'Isa-52-7');
    const joined = spans.map((s) => s.text).join(' ');
    expect(joined.toLowerCase()).not.toMatch(/mountainsare/);
    expect(joined.toLowerCase()).toContain('beautiful');
  });

  test('parseKeyVerseRef reads Gen-15-5', () => {
    expect(parseKeyVerseRef('Gen-15-5')).toEqual({ book: 'Gen', chapter: 15, verse: 5 });
  });
});

describe('PlanCompanion.json (real data)', () => {
  const plan = REAL.adventJourneyChronological;
  const stories = findCatalogItem('adventJourneyChronological')!.stories;

  test('has 26 days, each with 3 audiences × 4 questions', () => {
    expect(plan).toBeTruthy();
    expect(Object.keys(plan.days)).toHaveLength(26);
    for (let d = 1; d <= 26; d++) {
      const day = plan.days[String(d)];
      expect(day.storyId).toBe(stories[d - 1]);
      for (const aud of ['family', 'school', 'smallgroup'] as const) {
        expect(day.questions[aud]).toHaveLength(4);
      }
      expect(day.intro.trim().split(/\s+/).length).toBeLessThanOrEqual(60);
    }
  });

  test('antiphons only on days 19–25', () => {
    for (let d = 1; d <= 26; d++) {
      const has = !!plan.days[String(d)].antiphon;
      expect(has).toBe(d >= 19 && d <= 25);
    }
  });

  test('key verses resolve inside their story content', () => {
    for (let d = 1; d <= 26; d++) {
      const day = plan.days[String(d)];
      const content = BIBLE[day.storyId]?.content;
      for (const ref of day.keyVerses) {
        expect(keyVerseSpans(content, ref).length).toBeGreaterThan(0);
      }
    }
  });

  test('finish points at 12 Days of Christmas', () => {
    expect(plan.finish?.nextPlanId).toBe('christmas12');
    expect(plan.finish?.body.trim().split(/\s+/).length).toBeLessThanOrEqual(80);
  });
});
