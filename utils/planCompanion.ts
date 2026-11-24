/**
 * Plan companion content: daily intros, key verses, plan questions and
 * O Antiphon prayers shown when a story is opened from a themed plan.
 */

import PlanCompanionData from '@/assets/data/PlanCompanion.json';
import { readableOn } from '@/utils/contrast';
import { getChronologicalMapping } from '@/utils/chronologicalPlans';
import { findCatalogItem } from '@/utils/planCatalog';

export type CompanionAudience = 'family' | 'school' | 'smallgroup';

export type CompanionAntiphon = {
  title: string;
  prayer: string;
  sources: string;
  prayerFr?: string;
};

export type CompanionDayData = {
  storyId: string;
  intro: string;
  introFr?: string;
  keyVerses: string[];
  questions: Record<CompanionAudience, string[]>;
  questionsFr?: Partial<Record<CompanionAudience, string[]>>;
  closing: string;
  closingFr?: string;
  antiphon: CompanionAntiphon | null;
  response?: string;
};

export type CompanionPlan = {
  version: number;
  days: Record<string, CompanionDayData>;
  finish?: { title: string; body: string; nextPlanId: string; titleFr?: string; bodyFr?: string };
};

export type CompanionDay = {
  planId: string;
  day: number;
  total: number;
  storyId: string;
  phase: string;
  weekTitleKey: string;
  colour: string;
  intro: string;
  keyVerses: string[];
  questions: Record<CompanionAudience, string[]>;
  closing: string;
  antiphon: CompanionAntiphon | null;
  finish?: CompanionPlan['finish'];
};

type CompanionFile = Record<string, CompanionPlan>;

const DEFAULT_DATA = PlanCompanionData as CompanionFile;

/** Card fill: week colour made readable for white text (Joy needs a slight darken). */
export function companionCardColour(weekColour: string): string {
  return readableOn(weekColour, '#FFFFFF', 4.5);
}

export function weekColour(planId: string, dayIndex: number): string | null {
  const item = findCatalogItem(planId);
  const mapping = getChronologicalMapping(item?.chronologicalMapping || planId);
  if (!mapping) return null;
  const seg = mapping.segments.filter((s) => s.segmentId.startsWith('S'))[dayIndex];
  if (!seg) return null;
  return mapping.phases[seg.phase]?.color || null;
}

/**
 * Companion content for a story opened from a plan, or null when the plan has
 * no companion (or the story is not in it). `dayIndex` is 0-based; when omitted
 * it is taken from the plan's story list.
 */
export function getCompanionDay(
  planId: string | undefined | null,
  storyId: string,
  lang: string = 'en',
  data: CompanionFile = DEFAULT_DATA,
  dayIndex?: number
): CompanionDay | null {
  if (!planId || !storyId) return null;
  const plan = data[planId];
  if (!plan?.days) return null;

  const item = findCatalogItem(planId);
  const stories = item?.stories || [];
  const index = dayIndex != null ? dayIndex : stories.indexOf(storyId);
  if (index < 0) return null;

  const dayNum = index + 1;
  const day = plan.days[String(dayNum)];
  if (!day || day.storyId !== storyId) return null;

  const mapping = getChronologicalMapping(item?.chronologicalMapping || planId);
  const seg = mapping?.segments.filter((s) => s.segmentId.startsWith('S'))[index];
  const phase = seg?.phase || '';
  const rawColour = mapping?.phases[phase]?.color || '#6A4C93';
  const fr = lang.startsWith('fr');

  // French: only surface companion UI when French text exists for this day.
  if (fr) {
    const hasFr =
      !!day.introFr &&
      !!day.closingFr &&
      !!day.questionsFr?.family?.length &&
      !!day.questionsFr?.school?.length &&
      !!day.questionsFr?.smallgroup?.length;
    if (!hasFr) return null;
  }

  return {
    planId,
    day: dayNum,
    total: Object.keys(plan.days).length,
    storyId,
    phase,
    weekTitleKey: phase,
    colour: companionCardColour(rawColour),
    intro: fr && day.introFr ? day.introFr : day.intro,
    keyVerses: day.keyVerses || [],
    questions: {
      family: (fr && day.questionsFr?.family) || day.questions.family,
      school: (fr && day.questionsFr?.school) || day.questions.school,
      smallgroup: (fr && day.questionsFr?.smallgroup) || day.questions.smallgroup,
    },
    closing: fr && day.closingFr ? day.closingFr : day.closing,
    antiphon: day.antiphon
      ? {
          ...day.antiphon,
          prayer: fr && day.antiphon.prayerFr ? day.antiphon.prayerFr : day.antiphon.prayer,
        }
      : null,
    finish: plan.finish,
  };
}

export function getCompanionFinish(
  planId: string | undefined | null,
  data: CompanionFile = DEFAULT_DATA
): CompanionPlan['finish'] | null {
  if (!planId) return null;
  return data[planId]?.finish || null;
}
