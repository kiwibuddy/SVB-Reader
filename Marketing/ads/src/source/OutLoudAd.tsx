/**
 * Film 3 · Out Loud. Public-domain etchings printed with the app's four inks
 * carry the history of reading Scripture aloud, together, into the app's four
 * parts. Artworks and credits: scripts/etch.py, public/source/art/. See SOURCE.md.
 */
import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { partSlots, PartsReader } from '../advent/screens';
import { Phone } from '../lib/Phone';
import { light } from '../theme';
import credits from '../../public/source/art/credits.json';
import { QUOTES, QuoteId, STORIES } from './data';
import { clamp, DISPLAY, EndCard, Grain, INK_PAPER, ON_PAPER, PAPER, TEXT, Words } from './kit';
import { NAMES } from './MonologueAd';

/** Cuts in frames (spec: 0, 2.5, 4.5, 6.0, then four 2 s images, 14.0, 16.0, 24.0, 26.0 s). */
export const OL = {
  HOOK: 0, LOUD: 75, TOGETHER: 135, SQUARES: 180, SYNAGOGUES: 240, LETTERS: 300, TABLES: 360,
  LIFT: 420, APP: 480, CHAIR: 720, END: 780,
} as const;

type ArtKey = keyof typeof credits;
const LABEL = 'rgba(23,20,15,0.62)';

const MuseumLabel: React.FC<{ art: ArtKey; top: number }> = ({ art, top }) => {
  const c = credits[art];
  return (
    <div style={{ position: 'absolute', left: 65, right: 65, top, font: `400 26px/1.4 ${TEXT}`, color: LABEL }}>
      <b style={{ color: INK_PAPER, fontWeight: 600 }}>{c.artist}</b>, <i>{c.title}</i>, {c.date}. {c.place}
    </div>
  );
};

/** A narrator turn as the app draws it, printed over the etching. */
const Said: React.FC<{ id: QuoteId; at: number; top: number }> = ({ id, at, top }) => {
  const frame = useCurrentFrame();
  const q = QUOTES[id];
  const t = interpolate(frame, [at, at + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  return (
    <div
      style={{
        position: 'absolute',
        left: 65,
        right: 150,
        top,
        opacity: Math.min(1, t * 1.4),
        transform: `translateY(${(1 - t) * 30}px) scale(${0.96 + t * 0.04})`,
        transformOrigin: '0% 100%',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 28,
          padding: '26px 32px',
          font: `400 40px/1.36 ${TEXT}`,
          color: light.ink,
          boxShadow: '0 18px 40px rgba(23,20,15,0.22), 0 2px 6px rgba(23,20,15,0.12)',
        }}
      >
        <div style={{ font: `600 22px/1 ${TEXT}`, letterSpacing: '0.14em', color: ON_PAPER.black, textTransform: 'uppercase', marginBottom: 14 }}>
          The Narrator · {q.ref}
        </div>
        {q.text}
      </div>
    </div>
  );
};

/** One print on paper with a line above it and its museum label below. */
const Plate: React.FC<{ art: ArtKey; from: number; to: number; line: string; said?: QuoteId; imgTop?: number }> = ({
  art,
  from,
  to,
  line,
  said,
  imgTop = 560,
}) => {
  const frame = useCurrentFrame();
  const c = credits[art];
  const w = 1000;
  const h = Math.round((c.height / c.width) * w);
  const push = interpolate(frame, [from, to], [1, 1.05], clamp);
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <Words text={line} start={from + 2} perWord={3} style={{ position: 'absolute', left: 65, right: 65, top: 300, font: `400 124px/1 ${DISPLAY}`, color: INK_PAPER }} />
      <div style={{ position: 'absolute', left: 40, top: imgTop, width: w, height: h, overflow: 'hidden', boxShadow: '0 1px 0 rgba(23,20,15,0.15)' }}>
        <Img src={staticFile(c.file)} style={{ width: w, height: h, transform: `scale(${push})` }} />
      </div>
      <MuseumLabel art={art} top={imgTop - 48} />
      {said ? <Said id={said} at={from + 16} top={imgTop + h - 90} /> : null}
    </AbsoluteFill>
  );
};

/** 0–6 s: the tall Rembrandt crop, the sentence building above it. */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const c = credits['synagogue-tall'];
  const w = 1080;
  const h = Math.round((c.height / c.width) * w);
  const push = interpolate(frame, [0, OL.SQUARES], [1.02, 1.1], clamp);
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <div style={{ position: 'absolute', left: 0, top: 560, width: w, height: h, overflow: 'hidden' }}>
        <Img src={staticFile(c.file)} style={{ width: w, height: h, transform: `scale(${push})`, transformOrigin: '50% 30%' }} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 560, background: PAPER }} />
      <div style={{ position: 'absolute', left: 65, right: 65, top: 270, display: 'grid', gap: 6 }}>
        <Words text="Long before most people owned a Bible," start={-8} perWord={2} style={{ font: `400 96px/1 ${DISPLAY}`, color: INK_PAPER }} />
        <Words text="it was read out loud." start={OL.LOUD} perWord={4} style={{ font: `400 96px/1 ${DISPLAY}`, color: INK_PAPER }} />
      </div>
      {frame >= OL.TOGETHER ? (
        <Words
          text="Together."
          start={OL.TOGETHER}
          perWord={1}
          style={{
            position: 'absolute',
            left: 65,
            top: 1010,
            font: `400 230px/1 ${DISPLAY}`,
            color: '#FFFFFF',
            textShadow: '0 4px 30px rgba(0,0,0,0.45)',
          }}
        />
      ) : null}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 560 + h, bottom: 0, background: PAPER }} />
      <MuseumLabel art="synagogue-tall" top={560 + h + 22} />
    </AbsoluteFill>
  );
};

/** 14–16 s: the four inks lift off the etching and become the app's four part boxes. */
const Lift: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [OL.LIFT + 4, OL.LIFT + 34], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const inks = ['black', 'red', 'green', 'blue'] as const;
  const fills = { black: '#FFFFFF', red: light.divFill, green: light.prinFill, blue: light.chorFill };
  // Where each ink sat on the refectory print (fractions of the 1000 px plate at y 560).
  const from = [
    [0.08, 0.39],
    [0.425, 0.4],
    [0.648, 0.385],
    [0.813, 0.564],
  ];
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <Words text="Four people. One story." start={OL.LIFT + 10} perWord={3} style={{ position: 'absolute', left: 65, right: 65, top: 300, font: `400 124px/1 ${DISPLAY}`, color: INK_PAPER }} />
      {inks.map((ink, i) => {
        const x0 = 40 + from[i][0] * 1000 - 80;
        const y0 = 560 + from[i][1] * 693 - 90;
        const x1 = 65 + i * 245;
        const y1 = 860;
        const size0 = 170;
        const size1 = 215;
        const s = size0 + (size1 - size0) * t;
        return (
          <div key={ink} style={{ position: 'absolute', left: x0 + (x1 - x0) * t, top: y0 + (y1 - y0) * t, display: 'grid', gap: 18, justifyItems: 'center', width: s }}>
            <div
              style={{
                width: s,
                height: s * 0.82,
                borderRadius: 26 + 10 * (1 - t),
                borderTopLeftRadius: 26 - 16 * t,
                background: t < 0.5 ? ON_PAPER[ink] : fills[ink],
                border: `${4 + 2 * t}px solid ${ON_PAPER[ink]}`,
                opacity: 0.55 + 0.45 * t,
              }}
            />
            <div style={{ font: `600 40px/1 ${TEXT}`, color: ON_PAPER[ink], opacity: t }}>{NAMES[i]}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** 16–24 s: the app, four friends on Moses' call. */
const InTheApp: React.FC = () => {
  const frame = useCurrentFrame();
  const story = STORIES.moses;
  const slots = partSlots(story.readers);
  const rise = interpolate(frame, [OL.APP, OL.APP + 22], [1950, 640], { ...clamp, easing: Easing.out(Easing.cubic) });
  const lines: Array<[string, number, number]> = [
    ['Everyone takes a part.', OL.APP, OL.APP + 80],
    ['Nobody has to lead.', OL.APP + 80, OL.APP + 160],
    ['Questions after every story.', OL.APP + 160, OL.CHAIR],
  ];
  return (
    <AbsoluteFill style={{ background: light.bg }}>
      {lines.map(([text, a, b]) => (
        <div
          key={text}
          style={{
            position: 'absolute',
            left: 65,
            right: 65,
            top: 300,
            font: `400 104px/1 ${DISPLAY}`,
            color: INK_PAPER,
            opacity: interpolate(frame, [a, a + 10, b - 8, b], [0, 1, 1, 0], clamp),
          }}
        >
          {text}
        </div>
      ))}
      <Phone x={(1080 - 748) / 2} y={rise}>
        <PartsReader
          story={story}
          lines={story.lines}
          names={NAMES}
          pick={slots.indexOf('green')}
          namesAt={OL.APP + 10}
          pickAt={OL.APP + 30}
          readAt={OL.APP + 40}
          step={26}
          readFrom={1}
        />
      </Phone>
    </AbsoluteFill>
  );
};

const Chair: React.FC = () => (
  <AbsoluteFill style={{ background: PAPER }}>
    <div style={{ position: 'absolute', left: 65, right: 65, top: 269, height: 979, display: 'flex', alignItems: 'center' }}>
      <Words text="Pull up a chair." start={OL.CHAIR + 4} perWord={4} style={{ font: `400 210px/0.96 ${DISPLAY}`, color: INK_PAPER }} />
    </div>
  </AbsoluteFill>
);

export const OutLoudAd: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (a: number, b: number) => frame >= a && frame < b;
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      {at(OL.HOOK, OL.SQUARES) ? <Hook /> : null}
      {at(OL.SQUARES, OL.SYNAGOGUES) ? <Plate art="ezra" from={OL.SQUARES} to={OL.SYNAGOGUES} line="In city squares." said="neh" imgTop={520} /> : null}
      {at(OL.SYNAGOGUES, OL.LETTERS) ? <Plate art="synagogue" from={OL.SYNAGOGUES} to={OL.LETTERS} line="In synagogues." said="luke" /> : null}
      {at(OL.LETTERS, OL.TABLES) ? <Plate art="paul" from={OL.LETTERS} to={OL.TABLES} line="In letters." said="thess" /> : null}
      {at(OL.TABLES, OL.LIFT) ? <Plate art="refectory" from={OL.TABLES} to={OL.LIFT} line="Around dinner tables." /> : null}
      {at(OL.LIFT, OL.APP) ? <Lift /> : null}
      {at(OL.APP, OL.CHAIR) ? <InTheApp /> : null}
      {at(OL.CHAIR, OL.END) ? <Chair /> : null}
      {frame >= OL.END ? <EndCard at={OL.END} /> : null}
      <Grain />
      <Audio src={staticFile('music/source-outloud.mp3')} />
    </AbsoluteFill>
  );
};
