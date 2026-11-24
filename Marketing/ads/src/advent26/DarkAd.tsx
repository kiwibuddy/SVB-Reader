/**
 * Advent 2026 · Advent Starts in the Dark. On black, lines appear only where a
 * candle's light reaches them; the four Advent candles light; the screen ends warm.
 * Scripture from the app's Advent plan (Day 1, Day 7, Day 19). Music: "Silent Night".
 */
import React from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { HOLY_CITY } from '../advent/data';
import { ADVENT } from '../advent/timeline';
import { Phone, StatusBar } from '../lib/Phone';
import { Bubble, heightOf, StoryHeader } from '../lib/ReaderBits';
import { INK, light } from '../theme';
import { clamp, DISPLAY, EndCard, Grain, TEXT, Words } from '../source/kit';
import { ADVENT_QUOTES } from './data';

export const DK = { HOOK: 0, POINT: 75, ISAIAH: 135, HARD: 270, REV: 330, CANDLES: 480, JOHN: 600, APP: 690, END: 780 } as const;

const NIGHT = '#06080A';
const WARM = '#22160D';
const CREAM = '#F5E6CF';

/** Candle flicker: a few slow sines, deterministic per frame. */
const flicker = (f: number, seed = 0) => 1 + 0.06 * Math.sin(f * 0.71 + seed) + 0.04 * Math.sin(f * 1.93 + seed * 2) + 0.03 * Math.sin(f * 3.7 + seed * 3);

const Flame: React.FC<{ x: number; y: number; size?: number; on: number; seed?: number }> = ({ x, y, size = 1, on, seed = 0 }) => {
  const frame = useCurrentFrame();
  const k = flicker(frame, seed);
  const sway = Math.sin(frame * 0.23 + seed) * 2.5;
  const w = 34 * size;
  const h = 78 * size * k;
  return (
    <div style={{ position: 'absolute', left: x - w / 2 + sway, top: y - h, width: w, height: h, opacity: on, transform: `scale(${0.4 + 0.6 * on})`, transformOrigin: '50% 100%' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50% 50% 46% 46% / 64% 64% 36% 36%',
          background: 'radial-gradient(circle at 50% 74%, #FFFDF2 0 22%, #FFE39A 38%, #FFAE3D 58%, rgba(255,110,20,0) 74%)',
          filter: `blur(${1.2 * size}px)`,
        }}
      />
      <div style={{ position: 'absolute', left: '40%', right: '40%', bottom: -4 * size, height: 14 * size, borderRadius: 6, background: 'rgba(60,40,30,0.9)' }} />
    </div>
  );
};

const Candle: React.FC<{ x: number; y: number; h?: number; size?: number; on: number; seed?: number }> = ({ x, y, h = 250, size = 1, on, seed = 0 }) => {
  const frame = useCurrentFrame();
  const glow = on * flicker(frame, seed);
  const w = 74 * size;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: x - 520 * size,
          top: y - 560 * size,
          width: 1040 * size,
          height: 1040 * size,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,170,80,${0.36 * glow}) 0%, rgba(255,140,50,${0.12 * glow}) 38%, rgba(255,120,40,0) 70%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: x - w / 2,
          top: y,
          width: w,
          height: h * size,
          borderRadius: `${10 * size}px ${10 * size}px 4px 4px`,
          background: `linear-gradient(90deg, #6E5A48 0%, #E9DCC6 ${30 + 10 * on}%, #FFF4E2 48%, #CDB89C 70%, #4A3B30 100%)`,
          filter: `brightness(${0.25 + 0.75 * on})`,
        }}
      />
      <Flame x={x} y={y + 6 * size} size={size} on={on} seed={seed} />
    </>
  );
};

/** A line of type that is visible only where a moving pool of light falls on it. */
const LitLine: React.FC<{
  text: string;
  from: number;
  to: number;
  size: number;
  top: number;
  label?: string;
  color?: string;
}> = ({ text, from, to, size, top, label, color = CREAM }) => {
  const frame = useCurrentFrame();
  // The light finds the line from the left, then settles so the whole line can be read.
  const x = interpolate(frame, [from - 10, from + 34], [-160, 540], { ...clamp, easing: Easing.out(Easing.cubic) });
  const r = interpolate(frame, [from + 10, from + 60], [460, 1500], { ...clamp, easing: Easing.inOut(Easing.cubic) }) * flicker(frame, 1);
  const fade = interpolate(frame, [to - 10, to], [1, 0], clamp);
  const mask = `radial-gradient(${r}px ${r * 0.9}px at ${x}px 50%, #000 0%, #000 34%, rgba(0,0,0,0.5) 62%, rgba(0,0,0,0.08) 100%)`;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, opacity: fade, WebkitMaskImage: mask, maskImage: mask }}>
      <div style={{ padding: '0 65px', display: 'grid', gap: 26 }}>
        {label ? <div style={{ font: `600 28px/1 ${TEXT}`, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(245,230,207,0.7)' }}>{label}</div> : null}
        <div style={{ font: `400 ${size}px/1.02 ${DISPLAY}`, color, letterSpacing: -0.5 }}>{text}</div>
      </div>
    </div>
  );
};

/** 16–20 s: one candle a week. */
const FourCandles: React.FC = () => {
  const frame = useCurrentFrame();
  const weeks: Array<[string, string]> = [
    ['Hope', ADVENT.hope],
    ['Peace', ADVENT.peace],
    ['Joy', ADVENT.joy],
    ['Love', ADVENT.love],
  ];
  return (
    <>
      <div style={{ position: 'absolute', left: 65, right: 65, top: 300, font: `400 104px/1 ${DISPLAY}`, color: CREAM, opacity: interpolate(frame, [DK.CANDLES, DK.CANDLES + 12], [0, 1], clamp) }}>
        One candle a week.
      </div>
      {weeks.map(([name, c], i) => {
        const at = DK.CANDLES + 2 + i * 30;
        const on = interpolate(frame, [at, at + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        const x = 180 + i * 240;
        return (
          <React.Fragment key={name}>
            <Candle x={x} y={940} h={300} size={0.8} on={on} seed={i * 2.1} />
            <div
              style={{
                position: 'absolute',
                left: x - 120,
                width: 240,
                top: 1210,
                textAlign: 'center',
                font: `400 64px/1 ${DISPLAY}`,
                color: `color-mix(in srgb, ${c} 45%, #FFF1DC)`,
                opacity: on,
              }}
            >
              {name}
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};

/** 23–26 s: Day 1 in the app, a phone glowing in the dark. */
const PhoneGlow: React.FC = () => {
  const frame = useCurrentFrame();
  const story = HOLY_CITY;
  const rise = interpolate(frame, [DK.APP, DK.APP + 20], [1950, 660], { ...clamp, easing: Easing.out(Easing.cubic) });
  const order = ['black', 'red', 'green', 'blue'] as const;
  const mix: Array<[string, number]> = order.map((c) => [INK[c], story.mix[c]] as [string, number]).filter(([, w]) => w > 0);
  // Stop on Day 1's promise: "He will wipe every tear…".
  const tears = story.lines.findIndex((l) => l.text.includes('wipe every tear'));
  const above = story.lines.slice(0, tears).reduce((h, l) => h + heightOf(l, 30), 0);
  const scroll = interpolate(frame, [DK.APP + 10, DK.APP + 40], [-(above - 420), -(above - 120)], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <>
      <div style={{ position: 'absolute', left: 65, right: 65, top: 290, display: 'grid', gap: 14, opacity: interpolate(frame, [DK.APP, DK.APP + 12], [0, 1], clamp) }}>
        <div style={{ font: `400 96px/1 ${DISPLAY}`, color: CREAM }}>26 stories to Christmas.</div>
        <div style={{ font: `500 38px/1.3 ${TEXT}`, color: 'rgba(245,230,207,0.72)' }}>Day 1: The Holy City is Coming.</div>
      </div>
      <div style={{ position: 'absolute', left: 140, top: rise - 40, width: 800, height: 1500, borderRadius: 120, background: 'radial-gradient(closest-side, rgba(255,230,190,0.22), rgba(255,230,190,0))' }} />
      <Phone x={(1080 - 748) / 2} y={rise}>
        <AbsoluteFill style={{ background: light.bg }}>
          <StatusBar time="9:41" />
          <StoryHeader title={story.title} meta={story.meta} mix={mix} />
          <div style={{ position: 'absolute', left: 34, right: 34, top: 290, bottom: 0, overflow: 'hidden' }}>
            <div style={{ transform: `translateY(${scroll}px)` }}>
              {story.lines.map((l, i) => (
                <Bubble key={i} line={l} progress={1} size={30} app glow={l.text.includes('wipe every tear')} />
              ))}
            </div>
          </div>
        </AbsoluteFill>
      </Phone>
    </>
  );
};

export const DarkAd: React.FC = () => {
  const frame = useCurrentFrame();
  // The room warms as the candles light, and stays warm.
  const warmth = interpolate(frame, [DK.CANDLES, DK.JOHN], [0, 1], clamp);
  const bg = `color-mix(in srgb, ${WARM} ${Math.round(warmth * 100)}%, ${NIGHT})`;
  const one = frame < DK.CANDLES; // the single candle of the opening
  const candleOn = interpolate(frame, [0, 6], [0.75, 1], clamp);
  const q = ADVENT_QUOTES;
  return (
    <AbsoluteFill style={{ background: bg }}>
      {one ? <Candle x={540} y={1430} h={260} on={candleOn} /> : null}
      {frame < DK.ISAIAH ? (
        <>
          <LitLine text="Advent starts in the dark." from={-20} to={DK.ISAIAH} size={168} top={430} />
          {frame >= DK.POINT ? (
            <Words text="That's the point." start={DK.POINT} perWord={5} style={{ position: 'absolute', left: 65, top: 900, font: `400 84px/1 ${DISPLAY}`, color: 'rgba(245,230,207,0.8)' }} />
          ) : null}
        </>
      ) : null}
      {frame >= DK.ISAIAH && frame < DK.HARD ? <LitLine text={`“${q.isaiah.text}”`} label={`${q.isaiah.ref} · Day 7`} from={DK.ISAIAH} to={DK.HARD} size={128} top={420} /> : null}
      {frame >= DK.HARD && frame < DK.REV ? (
        <Words text="If this year was hard, you're right on time." start={DK.HARD + 4} perWord={3} style={{ position: 'absolute', left: 65, right: 65, top: 520, font: `400 120px/1.02 ${DISPLAY}`, color: CREAM }} />
      ) : null}
      {frame >= DK.REV && frame < DK.CANDLES ? <LitLine text={`“${q.tears.text}”`} label={`God · ${q.tears.ref} · Day 1`} from={DK.REV} to={DK.CANDLES} size={98} top={360} /> : null}
      {frame >= DK.CANDLES && frame < DK.JOHN ? <FourCandles /> : null}
      {frame >= DK.JOHN && frame < DK.APP ? (
        <div style={{ position: 'absolute', left: 65, right: 65, top: 430, display: 'grid', gap: 26 }}>
          <div style={{ font: `600 28px/1 ${TEXT}`, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(245,230,207,0.7)' }}>{q.john.ref} · Day 19</div>
          <Words text={`“${q.john.text}”`} start={DK.JOHN + 4} perWord={3} style={{ font: `400 120px/1.02 ${DISPLAY}`, color: CREAM }} />
        </div>
      ) : null}
      {frame >= DK.APP && frame < DK.END ? <PhoneGlow /> : null}
      {frame >= DK.END ? <EndCard at={DK.END} dark bg={WARM} line="Advent starts in the dark." sub="26 stories to Christmas. Join any day." /> : null}
      <Grain opacity={0.2} />
      <Audio src={staticFile('music/advent-dark.mp3')} />
    </AbsoluteFill>
  );
};
