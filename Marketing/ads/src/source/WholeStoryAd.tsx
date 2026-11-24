/**
 * Film 2 · The Whole Story. A familiar verse pulls back into its story, then
 * into all 365 stories as a rose window, then one story a day. See SOURCE.md.
 */
import React from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Phone, StatusBar } from '../lib/Phone';
import { Bubble, StoryHeader } from '../lib/ReaderBits';
import { INK, light } from '../theme';
import { MIX, QUOTES, STORIES } from './data';
import { clamp, DISPLAY, EndCard, Grain, INK_PAPER, NIGHT, ON_NIGHT, TEXT, Words } from './kit';
import { Rose } from './Rose';

/** Cuts in frames (spec: 0, 2.5, 6.0, 8.0, 16.0, 20.0, 26.0 s). */
export const WS = { VERSE: 0, CONTEXT: 75, QUESTION: 180, ROSE: 240, FACTS: 480, APP: 600, END: 780 } as const;

const JER = MIX.findIndex((s) => s.id === 'S215');
const ease = Easing.inOut(Easing.cubic);

/** 0–2.5 s: the verse as every "verse of the day" graphic shows it. */
const VerseCard: React.FC = () => {
  const frame = useCurrentFrame();
  const fall = interpolate(frame, [WS.CONTEXT - 12, WS.CONTEXT + 6], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(160deg, #F6C9B8 0%, #EFC8D6 46%, #C9C4EC 100%)',
        opacity: 1 - fall,
        transform: `translateY(${fall * 260}px) scale(${1 - fall * 0.12}) rotate(${fall * 4}deg)`,
      }}
    >
      <div style={{ position: 'absolute', left: 65, right: 65, top: 300, textAlign: 'center', font: `500 44px/1.2 ${TEXT}`, color: '#4A2E3C' }}>
        You know the verse.
      </div>
      <div style={{ position: 'absolute', left: 90, right: 90, top: 520, textAlign: 'center', display: 'grid', gap: 44 }}>
        <div style={{ font: `italic 400 112px/1.08 ${DISPLAY}`, color: '#4A2E3C' }}>{QUOTES.jer11.text}</div>
        <div style={{ font: `600 30px/1 ${TEXT}`, letterSpacing: '0.16em', color: '#6B4A5C', textTransform: 'uppercase' }}>
          {QUOTES.jer11.ref}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** A phrase that lights up from `at`. */
const Mark: React.FC<{ text: string; at: number }> = ({ text, at }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + 14], [0, 1], clamp);
  return (
    <span
      style={{
        backgroundImage: `linear-gradient(${ON_NIGHT.green}55, ${ON_NIGHT.green}55)`,
        backgroundSize: `${t * 100}% 100%`,
        backgroundRepeat: 'no-repeat',
        color: t > 0.5 ? '#FFFFFF' : undefined,
        borderRadius: 6,
      }}
    >
      {text}
    </span>
  );
};

/** 2.5–6 s: the verse inside Jeremiah's letter. */
const Context: React.FC = () => {
  const frame = useCurrentFrame();
  const inn = interpolate(frame, [WS.CONTEXT, WS.CONTEXT + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const [a4, b4] = QUOTES.jer4.text.split('all the captives he has exiled to Babylon');
  const [a10, b10] = QUOTES.jer10.text.split('You will be in Babylon for seventy years.');
  return (
    <AbsoluteFill style={{ background: NIGHT }}>
      <div style={{ position: 'absolute', left: 65, right: 65, top: 290, display: 'grid', gap: 10 }}>
        <Words text="It was written to exiles." start={WS.CONTEXT + 4} perWord={3} style={{ font: `400 100px/1.02 ${DISPLAY}`, color: '#F2F5F4' }} />
        <Words text="Seventy years from home." start={WS.CONTEXT + 50} perWord={3} style={{ font: `400 100px/1.02 ${DISPLAY}`, color: ON_NIGHT.green }} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 150,
          right: 65,
          top: 720,
          display: 'grid',
          gap: 14,
          justifyItems: 'end',
          opacity: inn,
          transform: `translateY(${(1 - inn) * 40}px)`,
        }}
      >
        <div style={{ font: `600 26px/1 ${TEXT}`, letterSpacing: '0.14em', color: ON_NIGHT.green, textTransform: 'uppercase' }}>
          Jeremiah · Jeremiah 29:4, 10 NLT
        </div>
        <div
          style={{
            border: `4px solid ${ON_NIGHT.green}`,
            borderRadius: 30,
            padding: '30px 34px',
            background: 'rgba(70,217,160,0.07)',
            color: '#D8E4DF',
            font: `400 40px/1.42 ${TEXT}`,
          }}
        >
          {a4}
          <Mark text="all the captives he has exiled to Babylon" at={WS.CONTEXT + 26} />
          {b4} … {a10}
          <Mark text="You will be in Babylon for seventy years." at={WS.CONTEXT + 50} />
          {b10}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 6–8 s. */
const Question: React.FC = () => (
  <AbsoluteFill style={{ background: NIGHT }}>
    <div style={{ position: 'absolute', left: 65, right: 65, top: 269, height: 979, display: 'flex', alignItems: 'center' }}>
      <Words text="Do you know the story?" start={WS.QUESTION + 4} perWord={4} style={{ font: `400 176px/0.98 ${DISPLAY}`, color: '#F2F5F4' }} />
    </div>
  </AbsoluteFill>
);

const Caption: React.FC<{ text: string; from: number; to: number; color?: string; top?: number; size?: number }> = ({
  text,
  from,
  to,
  color = '#F2F5F4',
  top = 290,
  size = 96,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [from, from + 10, to - 8, to], [0, 1, 1, 0], clamp);
  return (
    <div style={{ position: 'absolute', left: 65, right: 65, top, font: `400 ${size}px/1.02 ${DISPLAY}`, color, opacity: o }}>{text}</div>
  );
};

/** 8–20 s: one spoke, then all 365, then what it adds up to. */
const RoseScene: React.FC = () => {
  const frame = useCurrentFrame();
  // Runs past 365 so the last spokes finish growing too (each takes 14 steps to reach full length).
  const fill = interpolate(frame, [WS.ROSE + 36, WS.ROSE + 200], [0, 380], { ...clamp, easing: ease });
  const grow = (i: number) => {
    if (i === JER) return interpolate(frame, [WS.ROSE, WS.ROSE + 16], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    return interpolate(fill - i, [0, 14], [0, 1], clamp);
  };
  const focusOn = frame < WS.ROSE + 150;
  const rotate = interpolate(frame, [WS.ROSE, WS.APP], [0, 8], clamp);
  const zoom = interpolate(frame, [WS.ROSE, WS.ROSE + 60], [1.5, 1], { ...clamp, easing: ease });
  const legend = interpolate(frame, [WS.ROSE + 150, WS.ROSE + 166], [0, 1], clamp);
  const centre = interpolate(frame, [WS.ROSE + 200, WS.ROSE + 216], [0, 1], clamp);
  const voices: Array<[string, string]> = [
    ['Narrator', ON_NIGHT.black],
    ['God', ON_NIGHT.red],
    ['Principals', ON_NIGHT.green],
    ['Everyone else', ON_NIGHT.blue],
  ];
  return (
    <AbsoluteFill style={{ background: NIGHT }}>
      <Caption text="Story 215. Jeremiah's letter." from={WS.ROSE} to={WS.ROSE + 40} />
      <Caption text="365 stories. Genesis to Revelation." from={WS.ROSE + 40} to={WS.ROSE + 140} />
      <Caption text="Each one coloured by who is speaking." from={WS.ROSE + 140} to={WS.FACTS} />
      <Caption text="The whole Bible, in 365 stories." from={WS.FACTS} to={WS.FACTS + 62} />
      <Caption text="One a day, for a year." from={WS.FACTS + 62} to={WS.APP} color={ON_NIGHT.green} />
      <div style={{ position: 'absolute', left: 65, right: 65, top: 520, display: 'flex', gap: 26, flexWrap: 'wrap', opacity: legend * (frame < WS.FACTS ? 1 : 0) }}>
        {voices.map(([name, c]) => (
          <span key={name} style={{ font: `600 28px/1 ${TEXT}`, color: c, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            ● {name}
          </span>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 90, top: 640, width: 900, height: 900, transform: `scale(${zoom})`, transformOrigin: '50% 50%' }}>
        <Rose size={900} inner={150} grow={grow} rotate={rotate} focus={focusOn ? JER : undefined} dim={focusOn ? 0.15 : 0} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            font: `400 150px/1 ${DISPLAY}`,
            color: '#F2F5F4',
            opacity: centre,
          }}
        >
          365
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 20–26 s: Day 1 in the app. */
const DayOne: React.FC = () => {
  const frame = useCurrentFrame();
  const story = STORIES.creation;
  const rise = interpolate(frame, [WS.APP, WS.APP + 22], [1950, 620], { ...clamp, easing: Easing.out(Easing.cubic) });
  const order = ['black', 'red', 'green', 'blue'] as const;
  const mix: Array<[string, number]> = order.map((c) => [INK[c], story.mix[c]] as [string, number]).filter(([, w]) => w > 0);
  const current = Math.min(story.lines.length - 1, Math.max(0, Math.floor((frame - WS.APP - 30) / 28)));
  const scroll = interpolate(frame, [WS.APP + 60, WS.END], [0, -260], clamp);
  return (
    <AbsoluteFill style={{ background: light.bg }}>
      <Caption text="Day 1: God Creates." from={WS.APP} to={WS.APP + 88} color={INK_PAPER} />
      <Caption text="365 stories. One a day." from={WS.APP + 88} to={WS.END + 8} color={INK_PAPER} />
      <Phone x={(1080 - 748) / 2} y={rise}>
        <AbsoluteFill style={{ background: light.bg }}>
          <StatusBar time="7:02" />
          <StoryHeader title={story.title} meta={story.meta} mix={mix} />
          <div style={{ position: 'absolute', left: 34, right: 34, top: 290, bottom: 0, overflow: 'hidden' }}>
            <div style={{ transform: `translateY(${scroll}px)` }}>
              {story.lines.map((line, i) => (
                <Bubble key={i} line={line} progress={1} size={30} app glow={i === current} />
              ))}
            </div>
          </div>
        </AbsoluteFill>
      </Phone>
    </AbsoluteFill>
  );
};

export const WholeStoryAd: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: NIGHT }}>
      {frame < WS.QUESTION ? <Context /> : null}
      {frame < WS.CONTEXT + 8 ? <VerseCard /> : null}
      {frame >= WS.QUESTION && frame < WS.ROSE ? <Question /> : null}
      {frame >= WS.ROSE && frame < WS.APP ? <RoseScene /> : null}
      {frame >= WS.APP && frame < WS.END ? <DayOne /> : null}
      {frame >= WS.END ? <EndCard at={WS.END} /> : null}
      <Grain />
      <Audio src={staticFile('music/source-wholestory.mp3')} />
    </AbsoluteFill>
  );
};
