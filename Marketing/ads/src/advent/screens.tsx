import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Line } from '../data/script-gen3';
import { StatusBar } from '../lib/Phone';
import { Bubble, heightOf, StoryHeader } from '../lib/ReaderBits';
import { FILL, INK, light, SANS, type VoiceColor } from '../theme';
import { PHASES, ROWS, type PlanRow, type Story } from './data';
import { ADVENT } from './timeline';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/* ───────────────────────────── plan journey ───────────────────────────── */

/** In-device sizes, scaled up from the app (as in ReaderBits) so they read at feed size. */
const ROW = { title: 31, ref: 18, note: 22, gap: 14 };
const THREAD_X = 30;
const PHASE_H = 118;

const rowHeight = (r: PlanRow) => {
  const titleLines = Math.ceil((r.title.length * ROW.title * 0.52) / 560);
  const noteLines = Math.min(2, Math.ceil((r.note.length * ROW.note * 0.5) / 560));
  return 14 + titleLines * 38 + 26 + noteLines * 28 + ROW.gap + 8;
};

export type JourneyItem = { kind: 'phase'; week: PlanRow['week'] } | { kind: 'row'; row: PlanRow };

/** The rows of one or more weeks, in the order the Plan tab draws them. */
export function journeyItems(weeks: Array<PlanRow['week']>): JourneyItem[] {
  const out: JourneyItem[] = [];
  for (const week of weeks) {
    out.push({ kind: 'phase', week });
    for (const row of ROWS.filter((r) => r.week === week)) out.push({ kind: 'row', row });
  }
  return out;
}

export const itemHeight = (it: JourneyItem) => (it.kind === 'phase' ? PHASE_H : rowHeight(it.row));

/**
 * A plan's journey as the app draws it: week headings, then a thread of
 * beads with the date, reference, minutes, title and one-line note.
 */
export const Journey: React.FC<{
  items: JourneyItem[];
  appearAt: number;
  stagger: number;
  scrollY?: number;
  current?: string;
  sundayGlow?: number;
}> = ({ items, appearAt, stagger, scrollY = 0, current, sundayGlow = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let y = 0;
  return (
    <div style={{ position: 'relative', transform: `translateY(${-scrollY}px)` }}>
      {items.map((it, i) => {
        const p = spring({ frame: frame - (appearAt + i * stagger), fps, config: { damping: 200 }, durationInFrames: 14 });
        const top = y;
        y += itemHeight(it);
        if (it.kind === 'phase') {
          const ph = PHASES[it.week];
          return (
            <div
              key={`ph-${it.week}`}
              style={{ position: 'absolute', top, left: 0, right: 0, height: PHASE_H, opacity: p, transform: `translateY(${(1 - p) * 18}px)` }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: THREAD_X - 11,
                  top: 26,
                  width: 22,
                  height: 22,
                  background: ph.color,
                  transform: 'rotate(45deg)',
                  borderRadius: 4,
                }}
              />
              <div style={{ marginLeft: 76, paddingTop: 16 }}>
                <div style={{ font: `700 32px/40px ${SANS}`, color: ph.color }}>{ph.title}</div>
                <div style={{ font: `400 21px/28px ${SANS}`, color: light.mute, marginTop: 4, paddingRight: 20 }}>
                  {ph.description}
                </div>
              </div>
            </div>
          );
        }
        const r = it.row;
        const isCurrent = r.id === current;
        const glow = r.sunday ? sundayGlow : 0;
        const ink = PHASES[r.week].color;
        return (
          <div
            key={r.id}
            style={{ position: 'absolute', top, left: 0, right: 0, opacity: p, transform: `translateY(${(1 - p) * 18}px)` }}
          >
            {/* thread segment */}
            <div style={{ position: 'absolute', left: THREAD_X - 1.5, top: 0, height: itemHeight(it), width: 3, background: light.thread }} />
            <div
              style={{
                position: 'absolute',
                left: THREAD_X - (isCurrent ? 15 : 12),
                top: 20,
                width: isCurrent ? 30 : 24,
                height: isCurrent ? 30 : 24,
                borderRadius: 999,
                background: isCurrent ? light.acc : glow > 0 ? ink : light.bg,
                border: `3px solid ${isCurrent ? light.acc : glow > 0 ? ink : light.thread}`,
                boxShadow: glow > 0 ? `0 0 0 ${glow * 10}px ${ink}22` : 'none',
              }}
            />
            <div style={{ marginLeft: 76, paddingTop: 10, paddingRight: 20 }}>
              <div
                style={{
                  font: `${isCurrent ? 700 : 500} ${ROW.title}px/38px ${SANS}`,
                  letterSpacing: -0.4,
                  color: light.ink,
                }}
              >
                {r.title}
              </div>
              <div
                style={{
                  font: `600 ${ROW.ref}px/26px ${SANS}`,
                  letterSpacing: 1.6,
                  textTransform: 'uppercase',
                  color: isCurrent ? light.acc : glow > 0 ? ink : light.mute,
                }}
              >
                {r.date} · {r.ref} · {r.minutes} min
              </div>
              <div
                style={{
                  font: `400 ${ROW.note}px/28px ${SANS}`,
                  color: glow > 0 ? light.ink : light.mute,
                  marginTop: 2,
                }}
              >
                {r.note}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ───────────────────────────── invite card ───────────────────────────── */

/**
 * The Advent card at the top of the Plan tab. Before the tap: Join / Remind me.
 * After the tap it becomes the in-progress card the app shows once joined.
 */
export const InviteCard: React.FC<{ appearAt: number; tapAt: number }> = ({ appearAt, tapAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - appearAt, fps, config: { damping: 200 }, durationInFrames: 16 });
  const press = interpolate(frame, [tapAt, tapAt + 5, tapAt + 11], [1, 0.94, 1], clamp);
  const ring = interpolate(frame, [tapAt, tapAt + 18], [0, 1], clamp);
  const joined = interpolate(frame, [tapAt + 14, tapAt + 26], [0, 1], clamp);
  const first = ROWS[0];

  const box: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    borderRadius: 30,
    background: light.surf,
    padding: '26px 30px 28px',
  };
  const kickerStyle: React.CSSProperties = {
    font: `700 18px/24px ${SANS}`,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  };

  return (
    <div style={{ position: 'relative', height: 300, opacity: p, transform: `translateY(${(1 - p) * 24}px)` }}>
      {/* before: the invitation */}
      <div style={{ ...box, border: `3px solid ${ADVENT.purple}`, opacity: 1 - joined }}>
        <div style={{ ...kickerStyle, color: ADVENT.purple }}>Advent begins Sunday, November 29</div>
        <div style={{ font: `700 38px/46px ${SANS}`, letterSpacing: -0.8, color: light.ink, marginTop: 6 }}>Advent Journey</div>
        <div style={{ font: `400 23px/32px ${SANS}`, color: light.mute, marginTop: 6 }}>
          26 days from promise to manger, one story a day to Christmas Eve. About 10 minutes a day.
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
          <div
            style={{
              position: 'relative',
              background: ADVENT.purple,
              borderRadius: 16,
              padding: '14px 24px',
              font: `700 21px/26px ${SANS}`,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              color: '#FFFFFF',
              transform: `scale(${press})`,
              boxShadow: ring > 0 && ring < 1 ? `0 0 0 ${(1 - ring) * 30}px ${ADVENT.purple}33` : 'none',
            }}
          >
            Join Advent
          </div>
          <div
            style={{
              border: `2px solid ${ADVENT.purple}`,
              borderRadius: 16,
              padding: '12px 22px',
              font: `600 21px/26px ${SANS}`,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              color: ADVENT.purple,
            }}
          >
            Remind me
          </div>
        </div>
      </div>

      {/* after: the in-progress card */}
      {joined > 0 && (
        <div style={{ ...box, border: `3px solid ${light.acc}`, opacity: joined, transform: `scale(${0.97 + joined * 0.03})` }}>
          <div style={{ ...kickerStyle, color: light.acc }}>Starts Sun, Nov 29</div>
          <div style={{ font: `700 38px/46px ${SANS}`, letterSpacing: -0.8, color: light.ink, marginTop: 6 }}>Advent Journey</div>
          <div
            style={{
              font: `600 18px/24px ${SANS}`,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
              color: light.mute,
              marginTop: 10,
            }}
          >
            {first.title} · {first.ref}
          </div>
          <div style={{ font: `400 23px/31px ${SANS}`, color: light.mute, marginTop: 8 }}>{first.note}</div>
          <div style={{ height: 10, borderRadius: 5, background: light.hair, marginTop: 18 }} />
          <div style={{ font: `600 17px/22px ${SANS}`, letterSpacing: 1.4, color: light.mute, marginTop: 8 }}>0 OF 26</div>
        </div>
      )}
    </div>
  );
};

/* ───────────────────────────── four-part reader ───────────────────────────── */

const INK_ORDER: VoiceColor[] = ['black', 'red', 'green', 'blue'];

/** The four reading parts, sorted into ink order as the app does (utils/readerParts.ts). */
export function partSlots(readers: VoiceColor[]): VoiceColor[] {
  return [...readers].sort((a, b) => INK_ORDER.indexOf(a) - INK_ORDER.indexOf(b));
}

/**
 * Which of the four parts reads each turn: the k-th turn of an ink goes to the
 * (k mod n)-th part holding that ink — the app's rule.
 */
export function assignParts(lines: Line[], slots: VoiceColor[]): number[] {
  const seen: Record<string, number> = {};
  return lines.map((l) => {
    const holders = slots.map((s, i) => (s === l.color ? i : -1)).filter((i) => i >= 0);
    if (!holders.length) return -1;
    const k = seen[l.color] ?? 0;
    seen[l.color] = k + 1;
    return holders[k % holders.length];
  });
}

/** The app's picker: "Four parts — take one to read in your group". */
const PartsPicker: React.FC<{
  top: number;
  slots: VoiceColor[];
  names: string[];
  namesAt: number;
  pick: number;
  pickAt: number;
  speaking: number;
}> = ({ top, slots, names, namesAt, pick, pickAt, speaking }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const picked = spring({ frame: frame - pickAt, fps, config: { damping: 200 }, durationInFrames: 10 });
  return (
    <div style={{ position: 'absolute', left: 34, right: 34, top }}>
      <div style={{ font: `500 21px/28px ${SANS}`, color: light.mute, marginBottom: 14 }}>
        Four parts — take one to read in your group
      </div>
      <div
        style={{
          border: `2px solid ${light.hair}`,
          borderRadius: 24,
          background: light.surf,
          padding: '22px 22px 16px',
          display: 'flex',
          gap: 16,
        }}
      >
        {slots.map((ink, i) => {
          const name = spring({ frame: frame - (namesAt + i * 8), fps, config: { damping: 200 }, durationInFrames: 12 });
          const mine = i === pick && picked > 0.1;
          const talking = i === speaking;
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div
                style={{
                  height: 84,
                  borderRadius: 18,
                  borderTopLeftRadius: 6,
                  background: FILL[ink],
                  border: `${mine ? 4 : 2}px solid ${INK[ink]}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: talking ? `0 0 0 8px ${INK[ink]}26` : 'none',
                  transform: `scale(${talking ? 1.04 : 1})`,
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" style={{ transform: `scale(${mine ? picked : 0})` }}>
                  <path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    fill="none"
                    stroke={INK[ink]}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div
                style={{
                  font: `${mine ? 700 : 600} 23px/30px ${SANS}`,
                  color: INK[ink],
                  marginTop: 8,
                  opacity: name,
                  transform: `translateY(${(1 - name) * 8}px)`,
                }}
              >
                {names[i]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * A story open with four people reading. Turns arrive one at a time; the part
 * reading each turn lights up; the picked part's turns stay bright and the
 * rest dim once reading starts — what the reader holding this phone sees.
 */
export const PartsReader: React.FC<{
  story: Story;
  lines: Line[];
  names: string[];
  pick: number;
  namesAt: number;
  pickAt: number;
  readAt: number;
  step: number;
  windowTop?: number;
  windowHeight?: number;
  restBottom?: number;
}> = ({ story, lines, names, pick, namesAt, pickAt, readAt, step, windowTop = 500, windowHeight = 560, restBottom = 380 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slots = partSlots(story.readers);
  const parts = assignParts(lines, slots);
  // A two-line story title pushes everything below it down one line.
  const shift = story.title.length > 32 ? 48 : 0;

  const arrivals = lines.map((_, i) => readAt + i * step);
  const heights = lines.map(heightOf);
  const cum = (n: number) => heights.slice(0, n).reduce((a, b) => a + b, 0);
  // Scroll so the newest turn ends near restBottom, but never so far that its
  // first line leaves the window — a long speech is read from its start.
  const stackY = interpolate(
    frame,
    arrivals,
    arrivals.map((_, i) => Math.min(0, Math.max(restBottom - cum(i + 1), 40 - cum(i)))),
    clamp
  );
  const current = arrivals.reduce((acc, at, i) => (frame >= at ? i : acc), -1);
  const dimOn = interpolate(frame, [readAt + 4, readAt + 16], [0, 1], clamp);

  const mix: Array<[string, number]> = INK_ORDER.map((c) => [INK[c], story.mix[c]]).filter(([, w]) => (w as number) > 0) as Array<
    [string, number]
  >;

  return (
    <AbsoluteFill style={{ background: light.bg }}>
      <StatusBar time="7:31" />
      <StoryHeader title={story.title} meta={story.meta} mix={mix} />
      <PartsPicker
        top={262 + shift}
        slots={slots}
        names={names}
        namesAt={namesAt}
        pick={pick}
        pickAt={pickAt}
        speaking={current >= 0 ? parts[current] : -1}
      />
      <div
        style={{
          position: 'absolute',
          left: 34,
          right: 34,
          top: windowTop + shift,
          height: windowHeight,
          overflow: 'hidden',
          maskImage: 'linear-gradient(to bottom, transparent 0, #000 46px)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 46px)',
        }}
      >
        <div style={{ transform: `translateY(${stackY}px)`, paddingTop: 30 }}>
          {lines.map((line, i) => {
            const mine = parts[i] === pick;
            return (
              <Bubble
                key={i}
                line={line}
                progress={spring({ frame: frame - arrivals[i], fps, config: { damping: 200 }, durationInFrames: 12 })}
                dim={!mine && dimOn > 0.5}
                glow={mine && i === current}
              />
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Plan tab chrome around a journey. */
export const PlanFrame: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title = 'Plan' }) => (
  <AbsoluteFill style={{ background: light.bg }}>
    <StatusBar time="6:48" />
    <div style={{ position: 'absolute', left: 34, right: 34, top: 108 }}>
      <div style={{ font: `700 44px/52px ${SANS}`, letterSpacing: -1, color: light.ink }}>{title}</div>
    </div>
    {children}
  </AbsoluteFill>
);
