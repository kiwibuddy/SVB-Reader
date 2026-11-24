/**
 * Advent 2026 · Heavy Words. Hope, Peace, Joy and Love arrive in their December
 * shop-window costumes (wrapping paper, neon, a sale banner, a foil card); the
 * costume falls away and the plain word is left on paper with a line from its
 * week of the plan. Music: "Joy to the World", tacky shop version, then plain.
 */
import React from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { ADVENT } from '../advent/timeline';
import { clamp, DISPLAY, EndCard, Grain, INK_PAPER, PAPER, TEXT, Words } from '../source/kit';
import { ADVENT_QUOTES } from './data';

export const HW = { HOOK: 0, TURN: 90, HOPE: 150, PEACE: 285, JOY: 420, LOVE: 555, STACK: 690, END: 780 } as const;

type Week = 'hope' | 'peace' | 'joy' | 'love';
const SCRIPT = '"Pinyon Script", "Snell Roundhand", cursive';
const NEON = 'Monoton, Impact, sans-serif';

/* ---------------- the costumes ---------------- */

const WrappingPaper: React.FC<{ word: string }> = ({ word }) => (
  <AbsoluteFill
    style={{
      background:
        'repeating-linear-gradient(45deg, #B3141E 0 70px, #C8202A 70px 140px), #B3141E',
    }}
  >
    <AbsoluteFill
      style={{
        backgroundImage:
          'radial-gradient(circle, #F4CF6A 0 9px, transparent 10px), radial-gradient(circle, #FFFFFF 0 5px, transparent 6px)',
        backgroundSize: '180px 180px, 120px 120px',
        backgroundPosition: '0 0, 60px 90px',
        opacity: 0.8,
      }}
    />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', font: `400 330px/1 ${SCRIPT}`, color: '#FFFFFF', textShadow: '0 8px 0 #0E5A36, 0 14px 30px rgba(0,0,0,0.35)' }}>
      {word}
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 960, height: 70, background: '#0E5A36', boxShadow: '0 6px 0 #F4CF6A, 0 -6px 0 #F4CF6A' }} />
  </AbsoluteFill>
);

const NeonSign: React.FC<{ word: string; flick: number }> = ({ word, flick }) => (
  <AbsoluteFill style={{ background: 'radial-gradient(90% 60% at 50% 45%, #2A1230 0%, #0D0710 70%)' }}>
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 620,
        textAlign: 'center',
        font: `400 190px/1 ${NEON}`,
        color: '#FFE6FA',
        opacity: flick,
        textShadow: '0 0 8px #FF5BD6, 0 0 24px #FF2FC4, 0 0 60px #FF2FC4, 0 0 120px #B0109A',
      }}
    >
      {word.toUpperCase()}
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 880, textAlign: 'center', font: `600 40px/1 ${TEXT}`, letterSpacing: '0.4em', color: '#7FE7FF', opacity: flick, textShadow: '0 0 10px #31CFFF, 0 0 30px #31CFFF' }}>
      OPEN LATE
    </div>
  </AbsoluteFill>
);

const SaleBanner: React.FC<{ word: string }> = ({ word }) => (
  <AbsoluteFill style={{ background: 'radial-gradient(120% 80% at 50% 40%, #E0262B 0%, #8E0D16 100%)' }}>
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 520,
        textAlign: 'center',
        font: `400 360px/1 ${SCRIPT}`,
        background: 'linear-gradient(115deg, #FFF3B0 0%, #E7B53C 30%, #FFF6C8 48%, #C9912A 70%, #FFE9A0 100%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        filter: 'drop-shadow(0 8px 0 rgba(0,0,0,0.25))',
      }}
    >
      {word}
    </div>
    <div style={{ position: 'absolute', right: 110, top: 900, width: 280, height: 280, borderRadius: '50%', background: '#FFE14D', display: 'grid', placeItems: 'center', textAlign: 'center', font: `900 84px/0.92 ${TEXT}`, color: '#9E0F18', transform: 'rotate(-12deg)', boxShadow: '0 14px 0 rgba(0,0,0,0.2)' }}>
      50%
      <br />
      OFF
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1250, textAlign: 'center', font: `900 64px/1 ${TEXT}`, letterSpacing: '0.3em', color: '#FFFFFF' }}>CHRISTMAS SALE</div>
  </AbsoluteFill>
);

const FoilCard: React.FC<{ word: string }> = ({ word }) => (
  <AbsoluteFill style={{ background: 'radial-gradient(110% 80% at 50% 40%, #145A3C 0%, #0A2E20 100%)' }}>
    <AbsoluteFill style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.7) 0 3px, transparent 4px)', backgroundSize: '90px 110px', opacity: 0.45 }} />
    <div style={{ position: 'absolute', left: 110, right: 110, top: 420, bottom: 560, border: '6px solid #D9B45A', borderRadius: 20 }} />
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 600,
        textAlign: 'center',
        font: `400 320px/1 ${SCRIPT}`,
        background: 'linear-gradient(100deg, #8C6A22, #F6DE8E 40%, #B88A2E 60%, #FFF0B8)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {word}
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 980, textAlign: 'center', font: `500 44px/1 ${TEXT}`, letterSpacing: '0.2em', color: '#D9B45A' }}>WITH ♥ AT CHRISTMAS</div>
  </AbsoluteFill>
);

/* ---------------- one word, from costume to weight ---------------- */

const WORDS: Record<Week, { word: string; costume: 'wrap' | 'neon' | 'sale' | 'card'; quote: keyof typeof ADVENT_QUOTES; day: number; n: number }> = {
  hope: { word: 'Hope', costume: 'wrap', quote: 'child', day: 7, n: 1 },
  peace: { word: 'Peace', costume: 'neon', quote: 'peace', day: 9, n: 2 },
  joy: { word: 'Joy', costume: 'sale', quote: 'joy', day: 16, n: 3 },
  love: { word: 'Love', costume: 'card', quote: 'immanuel', day: 25, n: 4 },
};

const Costume: React.FC<{ week: Week }> = ({ week }) => {
  const frame = useCurrentFrame();
  const w = WORDS[week];
  if (w.costume === 'wrap') return <WrappingPaper word={w.word} />;
  if (w.costume === 'neon') return <NeonSign word={w.word} flick={frame % 9 === 3 ? 0.5 : 1} />;
  if (w.costume === 'sale') return <SaleBanner word={w.word} />;
  return <FoilCard word={w.word} />;
};

const WordSection: React.FC<{ week: Week; from: number; to: number }> = ({ week, from, to }) => {
  const frame = useCurrentFrame();
  const w = WORDS[week];
  const q = ADVENT_QUOTES[w.quote];
  const colour = ADVENT[week];
  // 0–28 frames: the costume. 28–46: it falls away. Then the word, plain.
  const fall = interpolate(frame, [from + 28, from + 46], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const neonOff = week === 'peace' ? interpolate(frame, [from + 28, from + 34], [1, 0], clamp) : 1;
  const plain = interpolate(frame, [from + 40, from + 52], [0, 1], clamp);
  const fade = interpolate(frame, [to - 6, to], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <div style={{ position: 'absolute', left: 65, right: 65, top: 300, opacity: plain * fade, display: 'grid', gap: 40 }}>
        <div style={{ font: `600 30px/1 ${TEXT}`, letterSpacing: '0.16em', textTransform: 'uppercase', color: colour }}>
          Week {w.n} · {w.word}
        </div>
        <div style={{ font: `400 300px/0.86 ${DISPLAY}`, color: INK_PAPER, letterSpacing: -4 }}>{w.word}.</div>
        <Words text={`“${q.text}”`} start={from + 52} perWord={2} style={{ font: `400 84px/1.06 ${DISPLAY}`, color: colour }} />
        <div style={{ font: `600 26px/1 ${TEXT}`, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(23,20,15,0.55)', opacity: interpolate(frame, [from + 70, from + 80], [0, 1], clamp) }}>
          {q.speaker} · {q.ref} · Day {w.day}
        </div>
      </div>
      {fall < 1 ? (
        <AbsoluteFill
          style={{
            opacity: (1 - fall) * neonOff,
            transform: `translateY(${fall * 1400}px) rotate(${fall * (week === 'joy' ? -14 : 9)}deg)`,
            transformOrigin: '50% 0%',
          }}
        >
          <Costume week={week} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/* ---------------- the film ---------------- */

/** 0–3 s: all four costumes, fast, with the line over them. */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const order: Week[] = ['joy', 'peace', 'hope', 'love'];
  const k = Math.min(3, Math.floor(frame / 22));
  return (
    <AbsoluteFill>
      <Costume week={order[k]} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, padding: '290px 65px 34px', background: 'linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0))' }}>
        <div style={{ font: `400 92px/1.02 ${DISPLAY}`, color: '#FFFFFF' }}>In December, these four words are everywhere.</div>
      </div>
    </AbsoluteFill>
  );
};

const Turn: React.FC = () => (
  <AbsoluteFill style={{ background: PAPER }}>
    <div style={{ position: 'absolute', left: 65, right: 65, top: 269, height: 979, display: 'flex', alignItems: 'center' }}>
      <Words text="Advent gives them their weight back." start={HW.TURN + 4} perWord={4} style={{ font: `400 150px/0.98 ${DISPLAY}`, color: INK_PAPER }} />
    </div>
  </AbsoluteFill>
);

const Stack: React.FC = () => {
  const frame = useCurrentFrame();
  const weeks: Week[] = ['hope', 'peace', 'joy', 'love'];
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <div style={{ position: 'absolute', left: 65, right: 65, top: 300, display: 'grid', gap: 4 }}>
        {weeks.map((wk, i) => {
          const t = interpolate(frame, [HW.STACK + i * 6, HW.STACK + i * 6 + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
          return (
            <div key={wk} style={{ font: `400 200px/0.92 ${DISPLAY}`, color: ADVENT[wk], opacity: t, transform: `translateX(${(1 - t) * -60}px)` }}>
              {WORDS[wk].word}.
            </div>
          );
        })}
        <Words text="Four weeks. 26 stories. One story." start={HW.STACK + 34} perWord={3} style={{ font: `400 76px/1.05 ${DISPLAY}`, color: INK_PAPER, marginTop: 36 }} />
      </div>
    </AbsoluteFill>
  );
};

export const WordsAd: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (a: number, b: number) => frame >= a && frame < b;
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      {at(HW.HOOK, HW.TURN) ? <Hook /> : null}
      {at(HW.TURN, HW.HOPE) ? <Turn /> : null}
      {at(HW.HOPE, HW.PEACE) ? <WordSection week="hope" from={HW.HOPE} to={HW.PEACE} /> : null}
      {at(HW.PEACE, HW.JOY) ? <WordSection week="peace" from={HW.PEACE} to={HW.JOY} /> : null}
      {at(HW.JOY, HW.LOVE) ? <WordSection week="joy" from={HW.JOY} to={HW.LOVE} /> : null}
      {at(HW.LOVE, HW.STACK) ? <WordSection week="love" from={HW.LOVE} to={HW.STACK} /> : null}
      {at(HW.STACK, HW.END) ? <Stack /> : null}
      {frame >= HW.END ? <EndCard at={HW.END} line="Give the words their weight back." sub="26 stories to Christmas. Join any day." /> : null}
      <Grain opacity={0.14} />
      <Audio src={staticFile('music/advent-words.mp3')} />
    </AbsoluteFill>
  );
};
