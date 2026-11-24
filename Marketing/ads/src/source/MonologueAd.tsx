/**
 * Film 1 · Never a Monologue. People in the Bible push back and God answers:
 * human lines on night, set right as the app sets humanity; replies on the
 * divine fill, set left. Then the same voices in the app. See SOURCE.md.
 */
import React from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { partSlots, PartsReader } from '../advent/screens';
import { Phone } from '../lib/Phone';
import { light } from '../theme';
import { QUOTES, QuoteId, STORIES } from './data';
import { clamp, DISPLAY, EndCard, Grain, INK_PAPER, Label, NIGHT, ON_NIGHT, ON_PAPER, PAPER, Words } from './kit';

/** Cuts, in frames at 30 fps (spec: 0, 2.0, 3.5, 6.5, 8.5, 11.5, 13.5, 14.0, 17.5, 20.0, 26.0 s). */
export const M = {
  MOSES: 0,
  GOD_WITH: 60,
  GIDEON: 105,
  GOD_GO: 195,
  THOMAS: 255,
  JESUS: 345,
  BLACK: 405,
  FATHER: 420,
  TURN: 525,
  APP: 600,
  END: 780,
  TOTAL: 900,
} as const;

export const NAMES = ['Maya', 'Josh', 'Sione', 'Priya'];

/** One quoted line, full screen. Humanity on night, set right; God on the divine fill, set left. */
const Exchange: React.FC<{ id: QuoteId; from: number; to: number; size: number; perWord?: number; lead?: number }> = ({
  id,
  from,
  to,
  size,
  perWord = 2,
  lead = 3,
}) => {
  const frame = useCurrentFrame();
  const q = QUOTES[id];
  const divine = q.color === 'red';
  const ink = divine ? ON_PAPER.red : ON_NIGHT[q.color];
  // A slow push for the length of the shot, so nothing ever sits dead still.
  const push = interpolate(frame, [from, to], [1, 1.035], clamp);
  return (
    <AbsoluteFill style={{ background: divine ? light.divFill : NIGHT }}>
      <div
        style={{
          position: 'absolute',
          left: 65,
          right: 65,
          top: 269,
          height: 979,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: divine ? 'flex-start' : 'flex-end',
          textAlign: divine ? 'left' : 'right',
          gap: 34,
          transform: `scale(${push})`,
          transformOrigin: divine ? '0% 50%' : '100% 50%',
        }}
      >
        <Label speaker={q.speaker} reference={q.ref} color={ink} start={from} />
        <Words
          text={`“${q.text}”`}
          start={from + lead}
          perWord={perWord}
          style={{ font: `400 ${size}px/1.02 ${DISPLAY}`, color: ink, letterSpacing: -0.5 }}
        />
      </div>
    </AbsoluteFill>
  );
};

/** "It was never a monologue." on paper. */
const Turn: React.FC = () => (
  <AbsoluteFill style={{ background: PAPER }}>
    <div style={{ position: 'absolute', left: 65, right: 65, top: 269, height: 979, display: 'flex', alignItems: 'center' }}>
      <Words
        text="It was never a monologue."
        start={M.TURN + 6}
        perWord={5}
        style={{ font: `400 196px/0.96 ${DISPLAY}`, color: INK_PAPER, letterSpacing: -1 }}
      />
    </div>
  </AbsoluteFill>
);

/** The same voices in the app: Gideon's exchange, four friends taking the parts. */
const InTheApp: React.FC = () => {
  const frame = useCurrentFrame();
  const story = STORIES.gideon;
  const slots = partSlots(story.readers);
  const rise = interpolate(frame, [M.APP, M.APP + 22], [1950, 610], { ...clamp, easing: Easing.out(Easing.cubic) });
  const swap = M.APP + 92;
  const a = interpolate(frame, [M.APP + 4, M.APP + 16, swap - 8, swap], [0, 1, 1, 0], clamp);
  const b = interpolate(frame, [swap, swap + 12], [0, 1], clamp);
  const caption: React.CSSProperties = {
    position: 'absolute',
    left: 65,
    right: 65,
    top: 290,
    font: `400 96px/1.0 ${DISPLAY}`,
    color: INK_PAPER,
    letterSpacing: -0.5,
  };
  return (
    <AbsoluteFill style={{ background: light.bg }}>
      <div style={{ ...caption, opacity: a }}>Every voice in its own colour.</div>
      <div style={{ ...caption, opacity: b }}>Read it out loud. Take a part.</div>
      <Phone x={(1080 - 748) / 2} y={rise}>
        <PartsReader
          story={story}
          lines={story.lines}
          names={NAMES}
          pick={slots.indexOf('green')}
          namesAt={M.APP + 20}
          pickAt={M.APP + 40}
          readAt={M.APP + 30}
          step={20}
          readFrom={1}
        />
      </Phone>
    </AbsoluteFill>
  );
};

export const MonologueAd: React.FC = () => {
  const frame = useCurrentFrame();
  const shot = (from: number, to: number, node: React.ReactNode) =>
    frame >= from && frame < to ? <React.Fragment key={from}>{node}</React.Fragment> : null;
  return (
    <AbsoluteFill style={{ background: NIGHT }}>
      {shot(M.MOSES, M.GOD_WITH, <Exchange id="moses" from={M.MOSES} to={M.GOD_WITH} size={172} lead={-6} />)}
      {shot(M.GOD_WITH, M.GIDEON, <Exchange id="godWith" from={M.GOD_WITH} to={M.GIDEON} size={196} />)}
      {shot(M.GIDEON, M.GOD_GO, <Exchange id="gideon" from={M.GIDEON} to={M.GOD_GO} size={142} />)}
      {shot(M.GOD_GO, M.THOMAS, <Exchange id="godGo" from={M.GOD_GO} to={M.THOMAS} size={176} />)}
      {shot(M.THOMAS, M.JESUS, <Exchange id="thomas" from={M.THOMAS} to={M.JESUS} size={138} />)}
      {shot(M.JESUS, M.BLACK, <Exchange id="jesus" from={M.JESUS} to={M.BLACK} size={162} />)}
      {shot(M.FATHER, M.TURN, <Exchange id="father" from={M.FATHER} to={M.TURN} size={158} perWord={7} lead={8} />)}
      {shot(M.TURN, M.APP, <Turn />)}
      {shot(M.APP, M.END, <InTheApp />)}
      {frame >= M.END ? <EndCard at={M.END} /> : null}
      <Grain />
      <Sequence from={0}>
        <Audio src={staticFile('music/source-monologue.mp3')} />
      </Sequence>
    </AbsoluteFill>
  );
};
