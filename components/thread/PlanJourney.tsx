import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated from 'react-native-reanimated';
import SegmentTitles from '@/assets/data/SegmentTitles.json';
import { DEPTH_X, ROW_HEIGHT, buildThread, type ThreadMark, type ThreadRow } from '@/components/thread/buildThread';
import { StoryBead, ThreadKnot } from '@/components/thread/ThreadBead';
import { ThreadRevealRow } from '@/components/thread/ThreadRevealRow';
import type { ThreadPalette } from '@/constants/Colors';
import { useThreadReveal } from '@/hooks/useThreadReveal';
import { getChronologicalPhases, getStoryNote, type ChronologicalPhase } from '@/utils/chronologicalPlans';
import { readableOn } from '@/utils/contrast';
import { hapticImpactLight } from '@/utils/haptics';
import { localizeStoryTitle } from '@/utils/localize';
import { nextUnreadStory, type CatalogItem } from '@/utils/planCatalog';
import { formatReadingMinutes, getSegmentReadingTime } from '@/utils/readingTime';
import { datedWindow, dateForDay, formatShortDate } from '@/utils/seasonalPlans';

const titles = SegmentTitles as Record<string, { title?: string; ref?: string; book?: string[] }>;
const AnimatedPath = Animated.createAnimatedComponent(Path);

export const PHASE_ROW_HEIGHT = 64;
const PHASE_MARK = 16;
const MORE_ROW_HEIGHT = 48;

/** Approximate glyph widths (px) for estimating wrapped lines in thread rows. */
const CHAR_W = { title: 7.4, now: 9.8, ref: 6.6, note: 5.9 };

function lineCount(text: string, width: number, charWidth: number): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil((text.length * charWidth) / Math.max(width, 80)));
}

/** Row height for a story that shows a date label or note, so wrapped text doesn't overlap. */
function storyRowHeight(opts: { title: string; ref: string; note?: string; current: boolean; depth: number; windowWidth: number }): number {
  const avail = opts.windowWidth - (DEPTH_X[opts.depth] + 16) - 14;
  const titleLines = lineCount(opts.title, avail, opts.current ? CHAR_W.now : CHAR_W.title);
  const refLines = lineCount(opts.ref, avail, CHAR_W.ref);
  const noteLines = opts.note ? Math.min(2, lineCount(opts.note, avail, CHAR_W.note)) : 0;
  const height = 6 + titleLines * (opts.current ? 23 : 18) + 2 + refLines * 12 + (noteLines ? 3 + noteLines * 15 : 0) + 6;
  return Math.max(opts.current ? ROW_HEIGHT.current : ROW_HEIGHT.story, Math.ceil(height));
}

type Translate = (key: string, params?: Record<string, unknown>) => string;

export type JourneyRow = ThreadRow & {
  kind: 'phase' | 'story' | 'more';
  storyId?: string;
  done?: boolean;
  current?: boolean;
  phase?: ChronologicalPhase;
  text?: { title: string; ref: string; note?: string };
  hidden?: number;
};

/** Title, ref line (date · book ref · minutes · read/continue) and note for one story. */
export function storyRowText(
  item: CatalogItem,
  storyId: string,
  done: boolean,
  current: boolean,
  t: Translate,
  language: string
) {
  const info = titles[storyId];
  const minutes = getSegmentReadingTime(storyId);
  const window = item.isUserPlan ? null : datedWindow(item.id, item.stories.length);
  const index = item.stories.indexOf(storyId);
  const dateLabel = window && index >= 0 ? formatShortDate(dateForDay(window, index), language) : '';
  const suffix = done ? ` · ${t('UI.thread.read')}` : current ? ` · ${t('UI.thread.continue')}` : '';
  const ref = `${dateLabel ? `${dateLabel} · ` : ''}${info?.book?.[0] || ''} ${info?.ref || ''}${
    minutes ? ` · ${formatReadingMinutes(minutes)}` : ''
  }${suffix}`;
  return {
    title: localizeStoryTitle(storyId, info?.title || storyId, language),
    ref,
    note: getStoryNote(item.chronologicalMapping, storyId, language),
    dated: !!dateLabel,
  };
}

/**
 * The rows of a plan's journey in reading order: week/phase headings and
 * stories, each knowing whether it is read or current. `baseDepth` is the
 * thread depth of the headings (1 under a catalog plan row, 0 standalone).
 * `limit` shows a window around the current story, plus a "See all" row.
 */
export function buildJourneyRows(
  item: CatalogItem,
  opts: {
    completedIds: Set<string>;
    startIndex: number;
    windowWidth: number;
    t: Translate;
    language: string;
    baseDepth: 0 | 1;
    limit?: { before: number; after: number };
  }
): JourneyRow[] {
  const { completedIds, t, language, windowWidth, baseDepth } = opts;
  const next = nextUnreadStory(item.stories, completedIds, opts.startIndex);
  const phases = getChronologicalPhases(item.chronologicalMapping, (key, field, fallback) =>
    t(`UI.chronologicalPhases.${item.chronologicalMapping}.${key}.${field}`, { defaultValue: fallback })
  );

  let visible: Set<string> | null = null;
  if (opts.limit) {
    const at = next ? next.day - 1 : item.stories.length - 1;
    const from = Math.max(0, at - opts.limit.before);
    const to = Math.min(item.stories.length, at + opts.limit.after + 1);
    visible = new Set(item.stories.slice(from, to));
  }

  const rows: JourneyRow[] = [];
  const pushStory = (storyId: string, depth: ThreadRow['depth']) => {
    const done = completedIds.has(storyId);
    const current = !done && next?.storyId === storyId;
    const text = storyRowText(item, storyId, done, current, t, language);
    rows.push({
      key: `${item.id}-${storyId}`,
      kind: 'story',
      depth,
      height:
        text.note || text.dated
          ? storyRowHeight({ ...text, current, depth, windowWidth })
          : current
            ? ROW_HEIGHT.current
            : ROW_HEIGHT.story,
      storyId,
      done,
      current,
      text,
    });
  };

  if (phases.length) {
    for (const phase of phases) {
      const ids = visible ? phase.storyIds.filter((id) => visible!.has(id)) : phase.storyIds;
      if (!ids.length) continue;
      rows.push({
        key: `ph-${item.id}-${phase.key}`,
        kind: 'phase',
        depth: baseDepth,
        height: PHASE_ROW_HEIGHT,
        markOffset: PHASE_MARK,
        phase,
      });
      for (const id of ids) pushStory(id, (baseDepth + 1) as ThreadRow['depth']);
    }
  } else {
    for (const id of item.stories) if (!visible || visible.has(id)) pushStory(id, 1);
  }

  if (visible && visible.size < item.stories.length) {
    rows.push({
      key: `more-${item.id}`,
      kind: 'more',
      depth: rows[rows.length - 1]?.depth ?? 1,
      height: MORE_ROW_HEIGHT,
      hidden: item.stories.length,
    });
  }
  return rows;
}

/** Draws one journey row on its thread mark. Shared by every place a plan is drawn. */
export function renderJourneyRow(
  row: JourneyRow,
  mark: ThreadMark,
  ctx: {
    palette: ThreadPalette;
    t: Translate;
    justCompletedId?: string | null;
    onOpenStory: (storyId: string) => void;
    onSeeAll?: () => void;
  }
) {
  const { palette } = ctx;
  if (row.kind === 'phase' && row.phase) {
    const phase = row.phase;
    return (
      <View style={[styles.threadRow, styles.phaseThreadRow, { height: row.height }]}>
        <ThreadKnot x={mark.x} rowHeight={row.height} open palette={palette} fillColor={phase.color} anchor={PHASE_MARK} />
        <View style={[styles.rowBody, { paddingLeft: DEPTH_X[row.depth] + 16 }]}>
          <Text style={[styles.phaseTitle, { color: readableOn(phase.color, palette.bg) }]} numberOfLines={1}>
            {phase.title}
          </Text>
          {!!phase.description && (
            <Text style={[styles.phaseBlurb, { color: palette.mute }]} numberOfLines={2}>
              {phase.description}
            </Text>
          )}
        </View>
      </View>
    );
  }
  if (row.kind === 'more') {
    return (
      <Pressable
        onPress={ctx.onSeeAll}
        accessibilityRole="button"
        style={[styles.threadRow, { height: row.height }]}
        hitSlop={8}
      >
        <View style={[styles.rowBody, { paddingLeft: DEPTH_X[row.depth] + 16 }]}>
          <Text style={[styles.more, { color: palette.acc }]}>{ctx.t('UI.planJourney.seeAll', { total: row.hidden })}</Text>
        </View>
      </Pressable>
    );
  }
  if (row.kind === 'story' && row.storyId && row.text) {
    const id = row.storyId;
    const current = !!row.current && !row.done;
    return (
      <Pressable
        onPress={() => {
          void hapticImpactLight();
          ctx.onOpenStory(id);
        }}
        style={[styles.threadRow, { height: row.height }]}
        hitSlop={12}
      >
        <StoryBead
          x={mark.x}
          rowHeight={row.height}
          done={!!row.done}
          current={current}
          justCompleted={ctx.justCompletedId === id}
          palette={palette}
        />
        <View style={[styles.storyText, { paddingLeft: DEPTH_X[row.depth] + 16 }]}>
          <Text style={[styles.storyTitle, { color: row.done ? palette.mute : palette.ink }, current && styles.storyNow]}>
            {row.text.title}
          </Text>
          <Text style={[styles.storyRef, { color: current ? palette.acc : palette.mute }]}>{row.text.ref}</Text>
          {!!row.text.note && (
            <Text style={[styles.storyNote, { color: palette.mute }]} numberOfLines={2}>
              {row.text.note}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }
  return null;
}

/**
 * A plan's whole journey on its own thread: what's read, what's current and
 * what's ahead, in the plan's reading order with weeks, dates and notes.
 * Fixed height, no inner scrolling, so it can sit inside any ScrollView.
 */
export default function PlanJourney({
  item,
  completedIds,
  startIndex,
  palette,
  t,
  language,
  justCompletedId,
  limit,
  onOpenStory,
  onSeeAll,
}: {
  item: CatalogItem;
  completedIds: Set<string>;
  startIndex: number;
  palette: ThreadPalette;
  t: Translate;
  language: string;
  justCompletedId?: string | null;
  limit?: { before: number; after: number };
  onOpenStory: (storyId: string) => void;
  onSeeAll?: () => void;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const rows = useMemo(
    () => buildJourneyRows(item, { completedIds, startIndex, windowWidth, t, language, baseDepth: 0, limit }),
    [item, completedIds, startIndex, windowWidth, t, language, limit]
  );
  const thread = useMemo(
    () =>
      buildThread(
        rows.map(({ key, depth, height, markOffset }) => ({ key, depth, height, markOffset })),
        { width: windowWidth, entry: 'left', exit: 'left' }
      ),
    [rows, windowWidth]
  );
  const { progress, pathProps } = useThreadReveal(thread.length, { replayOnFocus: false });

  return (
    <View style={[styles.wrap, { height: thread.height }]}>
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height={thread.height}>
        <AnimatedPath
          d={thread.d}
          fill="none"
          stroke={palette.thread}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={thread.length}
          animatedProps={pathProps}
        />
      </Svg>
      {rows.map((row, index) => {
        const mark = thread.marks[index];
        if (!mark) return null;
        return (
          <ThreadRevealRow key={row.key} index={index} total={rows.length} progress={progress}>
            {renderJourneyRow(row, mark, { palette, t, justCompletedId, onOpenStory, onSeeAll })}
          </ThreadRevealRow>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', overflow: 'visible' },
  threadRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 14, zIndex: 1 },
  phaseThreadRow: { alignItems: 'flex-start', paddingTop: 10, paddingBottom: 10 },
  rowBody: { flex: 1 },
  phaseTitle: { fontSize: 13, fontWeight: '600' },
  phaseBlurb: { fontSize: 11, lineHeight: 15, marginTop: 2, paddingRight: 8 },
  storyText: { flex: 1, paddingTop: 6, paddingBottom: 2 },
  storyTitle: { fontSize: 14 },
  storyNow: { fontSize: 18, fontWeight: '600' },
  storyRef: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },
  storyNote: { fontSize: 11, lineHeight: 15, marginTop: 3 },
  more: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
});
