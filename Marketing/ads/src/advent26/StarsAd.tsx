/**
 * Advent 2026 · Count the Stars. On Day 3 God tells Abraham to count the stars;
 * on Day 25 wise men say "We saw his star as it rose." In between, the plan's 26
 * stories light up as stars and join into one constellation. Music: "We Three Kings".
 */
import React from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { ROWS } from '../advent/data';
import { itemHeight, Journey, journeyItems, PlanFrame } from '../advent/screens';
import { ADVENT } from '../advent/timeline';
import { Phone } from '../lib/Phone';
import { clamp, DISPLAY, EndCard, Grain, TEXT, Words } from '../source/kit';
import { ADVENT_QUOTES } from './data';

export const ST = { HOOK: 0, BETHLEHEM: 105, STARS: 180, PATH: 240, WISE: 600, APP: 690, END: 780 } as const;

const SKY = '#060A18';
const STARLIGHT = '#F2F1EA';

/** Deterministic pseudo-random numbers, so every render draws the same sky. */
function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}
const r = rand(11);
const FIELD = Array.from({ length: 700 }, () => ({ x: r() * 1300 - 110, y: r() * 2300 - 190, m: r(), p: r() * 6.28 }));

/** The 26 days as a constellation: bottom left (Day 1) to top right (Day 26), a gentle S. */
const DAYS = ROWS.map((row, i) => {
  const t = i / 25;
  const jitter = rand(100 + i);
  return {
    row,
    x: 120 + t * 830 + Math.sin(t * 6.3) * 80 + (jitter() - 0.5) * 50,
    y: 1560 - t * 760 + Math.sin(t * 3.1) * 70 + (jitter() - 0.5) * 40,
  };
});

/** Short labels for the stars the film names. */
const NAMED: Record<number, string> = {
  2: 'The first promise of a Rescuer',
  3: 'Count the stars',
  5: 'Bethlehem',
  7: 'Immanuel',
  9: 'A ruler from Bethlehem',
  13: 'A future and a hope',
  19: 'The Word became human',
  25: 'We saw his star',
  26: 'Born in Bethlehem',
};
const tint = (week: string) => `color-mix(in srgb, ${ADVENT[week as keyof typeof ADVENT]} 35%, #FFFFFF)`;

const Sky: React.FC<{ drift: number }> = ({ drift }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <radialGradient id="glow">
          <stop offset="0" stopColor="#FFF6E0" stopOpacity="1" />
          <stop offset="1" stopColor="#FFD8A0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform={`translate(0 ${drift})`}>
        {FIELD.map((s, i) => {
          const tw = 0.55 + 0.45 * Math.sin(frame * 0.08 + s.p);
          return <circle key={i} cx={s.x} cy={s.y} r={s.m > 0.94 ? 2.6 : 0.8 + s.m * 1.1} fill={STARLIGHT} opacity={(0.18 + s.m * 0.55) * tw} />;
        })}
      </g>
    </svg>
  );
};

/** 8–20 s: the 26 days light up and join. */
const Constellation: React.FC<{ drift: number }> = ({ drift }) => {
  const frame = useCurrentFrame();
  const litAt = (i: number) => ST.PATH + 10 + i * 13;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <g transform={`translate(0 ${drift})`}>
        {DAYS.slice(1).map((d, i) => {
          const a = DAYS[i];
          const t = interpolate(frame, [litAt(i + 1) - 6, litAt(i + 1)], [0, 1], clamp);
          return t > 0 ? (
            <line key={i} x1={a.x} y1={a.y} x2={a.x + (d.x - a.x) * t} y2={a.y + (d.y - a.y) * t} stroke="rgba(255,226,180,0.55)" strokeWidth={2.4} />
          ) : null;
        })}
        {DAYS.map((d, i) => {
          const on = interpolate(frame, [litAt(i), litAt(i) + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
          if (on <= 0) return null;
          const big = d.row.n === 25 ? 1 + interpolate(frame, [ST.WISE - 20, ST.WISE + 30], [0, 1.6], clamp) : 1;
          const rr = (d.row.n === 25 ? 26 : 16) * on * big;
          return (
            <g key={d.row.n}>
              <circle cx={d.x} cy={d.y} r={rr * 3} fill="url(#glow)" opacity={0.8} />
              <circle cx={d.x} cy={d.y} r={rr * 0.55} fill={tint(d.row.week)} />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

/** The current star's name, beside it. */
const StarLabel: React.FC<{ drift: number }> = ({ drift }) => {
  const frame = useCurrentFrame();
  const i = Math.floor((frame - ST.PATH - 10) / 13);
  if (i < 0 || i > 25 || frame >= ST.WISE) return null;
  const d = DAYS[i];
  const name = NAMED[d.row.n];
  const o = interpolate(frame - (ST.PATH + 10 + i * 13), [0, 4, 11, 13], [0, 1, 1, name ? 1 : 0], clamp);
  const left = d.x > 640;
  return (
    <div
      style={{
        position: 'absolute',
        top: d.y + drift - 30,
        left: left ? undefined : d.x + 40,
        right: left ? 1080 - d.x + 40 : undefined,
        textAlign: left ? 'right' : 'left',
        opacity: o,
        display: 'grid',
        gap: 6,
      }}
    >
      <div style={{ font: `600 28px/1 ${TEXT}`, letterSpacing: '0.16em', color: tint(d.row.week), textTransform: 'uppercase' }}>Day {d.row.n}</div>
      <div style={{ font: `400 56px/1.05 ${DISPLAY}`, color: STARLIGHT, maxWidth: 560 }}>{name ?? d.row.title}</div>
    </div>
  );
};

const Quote: React.FC<{ id: 'stars' | 'wisemen'; from: number; day: number; size: number }> = ({ id, from, day, size }) => {
  const q = ADVENT_QUOTES[id];
  return (
    <div style={{ position: 'absolute', left: 65, right: 65, top: 300, display: 'grid', gap: 24 }}>
      <div style={{ font: `600 28px/1 ${TEXT}`, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(242,241,234,0.7)' }}>
        {q.speaker} · {q.ref} · Day {day}
      </div>
      <Words text={`“${q.text}”`} start={from} perWord={3} style={{ font: `400 ${size}px/1.02 ${DISPLAY}`, color: STARLIGHT }} />
    </div>
  );
};

const ALL = journeyItems(['hope', 'peace', 'joy', 'love']);
const TOTAL_H = ALL.reduce((sum, it) => sum + itemHeight(it), 0);

/** 23–26 s: the whole journey in the app. */
const InTheApp: React.FC = () => {
  const frame = useCurrentFrame();
  const rise = interpolate(frame, [ST.APP, ST.APP + 20], [1950, 640], { ...clamp, easing: Easing.out(Easing.cubic) });
  const scroll = interpolate(frame, [ST.APP + 20, ST.END], [0, Math.min(1500, TOTAL_H - 1100)], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <>
      <div style={{ position: 'absolute', left: 65, right: 65, top: 300, font: `400 96px/1 ${DISPLAY}`, color: STARLIGHT, opacity: interpolate(frame, [ST.APP, ST.APP + 12], [0, 1], clamp) }}>
        Follow the whole story to Christmas.
      </div>
      <Phone x={(1080 - 748) / 2} y={rise}>
        <PlanFrame title="Advent Journey">
          <div style={{ position: 'absolute', left: 34, right: 34, top: 186, bottom: 0, overflow: 'hidden' }}>
            <Journey items={ALL} appearAt={ST.APP} stagger={0} scrollY={scroll} sundayGlow={1} />
          </div>
        </PlanFrame>
      </Phone>
    </>
  );
};

export const StarsAd: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, ST.APP], [0, 50], clamp);
  const at = (a: number, b: number) => frame >= a && frame < b;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(130% 90% at 50% 100%, #19234A 0%, ${SKY} 55%, #03050C 100%)` }}>
      <Sky drift={drift} />
      {frame >= ST.PATH && frame < ST.APP ? <Constellation drift={drift} /> : null}
      {at(ST.PATH, ST.WISE) ? <StarLabel drift={drift} /> : null}
      {at(ST.HOOK, ST.BETHLEHEM) ? <Quote id="stars" from={-12} day={3} size={124} /> : null}
      {at(ST.BETHLEHEM, ST.STARS) ? (
        <Words text="Christmas didn't start in Bethlehem." start={ST.BETHLEHEM + 4} perWord={3} style={{ position: 'absolute', left: 65, right: 65, top: 520, font: `400 140px/1 ${DISPLAY}`, color: STARLIGHT }} />
      ) : null}
      {at(ST.STARS, ST.PATH) ? (
        <Words text="It started under these stars." start={ST.STARS + 4} perWord={3} style={{ position: 'absolute', left: 65, right: 65, top: 520, font: `400 140px/1 ${DISPLAY}`, color: STARLIGHT }} />
      ) : null}
      {at(ST.PATH, ST.WISE) ? (
        <div style={{ position: 'absolute', left: 65, right: 65, top: 290, font: `400 84px/1 ${DISPLAY}`, color: STARLIGHT, opacity: interpolate(frame, [ST.PATH, ST.PATH + 12, ST.WISE - 8, ST.WISE], [0, 1, 1, 0], clamp) }}>
          26 stories. One promise.
        </div>
      ) : null}
      {at(ST.WISE, ST.APP) ? <Quote id="wisemen" from={ST.WISE + 4} day={25} size={110} /> : null}
      {at(ST.APP, ST.END) ? <InTheApp /> : null}
      {frame >= ST.END ? <EndCard at={ST.END} dark bg={SKY} line="It started under these stars." sub="26 stories to Christmas. Join any day." /> : null}
      <Grain opacity={0.12} />
      <Audio src={staticFile('music/advent-stars.mp3')} />
    </AbsoluteFill>
  );
};
