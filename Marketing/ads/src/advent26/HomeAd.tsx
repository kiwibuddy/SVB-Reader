/**
 * Advent 2026 · Come Home to the Story. A family group chat in the lead-up to
 * Christmas: Mum suggests the Advent readings, Jess calls dibs on the angel, Sam
 * (this phone) holds out, then joins. The chat becomes the app's parts picker
 * with the same four names. Music: "Deck the Halls", lo-fi.
 */
import React from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { ANNUNCIATION } from '../advent/data';
import { partSlots, PartsReader } from '../advent/screens';
import { Phone } from '../lib/Phone';
import { light } from '../theme';
import { clamp, DISPLAY, EndCard, Grain, INK_PAPER, TEXT, Words } from '../source/kit';

export const HM = { CHAT: 0, APP: 520, LINE: 700, END: 780 } as const;

const ME = 'Sam';
type Msg = { at: number; from: string; text: string; react?: [number, string] } | { at: number; divider: string } | { at: number; typing: string; until: number };

/** The thread. `at` is the frame each message lands. */
export const THREAD: Msg[] = [
  { at: -30, divider: 'Last week' },
  { at: -30, from: 'Dad', text: 'Flights booked ✈️ landing the 19th' },
  { at: -30, from: 'Jess', text: 'home on the 22nd!! 🎄' },
  { at: -30, from: ME, text: 'might be the 23rd, work is mad' },
  { at: -30, from: 'Mum', text: 'Can’t wait to have you all under one roof 🥹' },
  { at: -30, divider: 'Today 7:42 pm' },
  { at: -30, from: 'Mum', text: 'Advent starts Sunday 🕯️ Doing the readings at ours again this year. Who’s in?' },
  { at: 40, typing: 'Jess', until: 52 },
  { at: 52, from: 'Jess', text: 'dibs on the angel 😇' },
  { at: 88, from: 'Dad', text: 'I’ll narrate. Obviously.' },
  { at: 118, typing: ME, until: 150 },
  { at: 160, typing: ME, until: 188 },
  { at: 190, from: ME, text: 'like when we were kids?' },
  { at: 228, from: 'Mum', text: 'It’s on an app now. Everyone gets a part, four colours. One story after dinner.' },
  { at: 276, from: 'Jess', text: 'Sam you can read whoever argues with God' },
  { at: 312, typing: ME, until: 338 },
  { at: 340, from: ME, text: '…ok fine. I’m in.', react: [356, '❤️'] },
  { at: 392, divider: 'Thu 24 Dec, Christmas Eve' },
  { at: 400, from: 'Mum', text: 'Everyone’s home 🥹 Tonight: Two Miraculous Births' },
  { at: 446, from: ME, text: 'saving Jess a seat. the angel’s late again' },
  { at: 478, from: 'Jess', text: 'on my way!!' },
];

const AVATAR: Record<string, string> = { Mum: '#C2507A', Dad: '#3F6FB5', Jess: '#0E6B4C', Sam: '#6A4C93' };

const Bubble: React.FC<{ m: Extract<Msg, { from: string }> }> = ({ m }) => {
  const frame = useCurrentFrame();
  const mine = m.from === ME;
  const t = interpolate(frame, [m.at, m.at + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const react = m.react ? interpolate(frame, [m.react[0], m.react[0] + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) }) : 0;
  return (
    <div style={{ display: 'grid', justifyItems: mine ? 'end' : 'start', gap: 8, opacity: Math.min(1, t * 1.5), transform: `scale(${0.9 + 0.1 * t})`, transformOrigin: mine ? '100% 100%' : '0% 100%' }}>
      {!mine ? <div style={{ font: `500 26px/1 ${TEXT}`, color: '#8A8A92', marginLeft: 92 }}>{m.from}</div> : null}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        {!mine ? (
          <div style={{ width: 66, height: 66, borderRadius: '50%', background: AVATAR[m.from], color: '#fff', display: 'grid', placeItems: 'center', font: `600 30px/1 ${TEXT}` }}>
            {m.from[0]}
          </div>
        ) : null}
        <div style={{ position: 'relative', maxWidth: 720, padding: '24px 32px', borderRadius: 40, background: mine ? '#2F7CF6' : '#E9E9EB', color: mine ? '#FFFFFF' : '#111', font: `400 44px/1.28 ${TEXT}` }}>
          {m.text}
          {m.react ? (
            <div style={{ position: 'absolute', left: -26, top: -30, width: 64, height: 64, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', display: 'grid', placeItems: 'center', fontSize: 34, transform: `scale(${react})` }}>
              {m.react[1]}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const Typing: React.FC<{ who: string }> = ({ who }) => {
  const frame = useCurrentFrame();
  const mine = who === ME;
  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginLeft: mine ? 0 : 82 }}>
      <div style={{ display: 'flex', gap: 10, padding: '28px 30px', borderRadius: 40, background: mine ? '#2F7CF6' : '#E9E9EB' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 16, height: 16, borderRadius: 8, background: mine ? '#FFFFFF' : '#8A8A92', opacity: 0.35 + 0.65 * Math.max(0, Math.sin((frame - i * 4) / 4)) }} />
        ))}
      </div>
    </div>
  );
};

const Chat: React.FC = () => {
  const frame = useCurrentFrame();
  const shown = THREAD.filter((m) => m.at <= frame && (!('typing' in m) || frame < m.until));
  const out = interpolate(frame, [HM.APP - 24, HM.APP], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: '#F7F7F8', opacity: 1 - out, transform: `scale(${1 - out * 0.06})` }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 250, background: '#FFFFFF', borderBottom: '2px solid #E4E4E8', display: 'grid', placeItems: 'end center', paddingBottom: 26 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ font: `600 44px/1.2 ${TEXT}`, color: '#111' }}>Home for Christmas 🎄</div>
          <div style={{ font: `500 30px/1.3 ${TEXT}`, color: '#8A8A92' }}>Mum, Dad, Jess, Sam</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 40, right: 40, top: 270, bottom: 300, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 22 }}>
        {shown.map((m, i) =>
          'divider' in m ? (
            <div key={i} style={{ textAlign: 'center', font: `500 28px/1 ${TEXT}`, color: '#8A8A92', margin: '18px 0' }}>{m.divider}</div>
          ) : 'typing' in m ? (
            <Typing key={i} who={m.typing} />
          ) : (
            <Bubble key={i} m={m} />
          ),
        )}
      </div>
      <div style={{ position: 'absolute', left: 40, right: 40, bottom: 190, height: 84, borderRadius: 42, border: '2px solid #D9D9DE', background: '#FFFFFF', display: 'flex', alignItems: 'center', padding: '0 34px', font: `400 36px/1 ${TEXT}`, color: '#B0B0B8' }}>
        Message
      </div>
    </AbsoluteFill>
  );
};

/** 17–23 s: the same four names in the app, reading Christmas Eve's story. */
const InTheApp: React.FC = () => {
  const frame = useCurrentFrame();
  const story = ANNUNCIATION;
  const slots = partSlots(story.readers);
  const names = ['Mum', 'Dad', 'Sam', 'Jess'];
  const rise = interpolate(frame, [HM.APP, HM.APP + 22], [1950, 600], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: light.bg }}>
      <Words text="Everyone gets a part." start={HM.APP + 6} perWord={3} style={{ position: 'absolute', left: 65, right: 65, top: 300, font: `400 110px/1 ${DISPLAY}`, color: INK_PAPER }} />
      <Phone x={(1080 - 748) / 2} y={rise}>
        <PartsReader
          story={story}
          lines={story.lines}
          names={names}
          pick={slots.indexOf('blue')}
          namesAt={HM.APP + 14}
          pickAt={HM.APP + 36}
          readAt={HM.APP + 50}
          step={26}
          readFrom={1}
        />
      </Phone>
    </AbsoluteFill>
  );
};

const Line: React.FC = () => (
  <AbsoluteFill style={{ background: '#F2EAE0' }}>
    <div style={{ position: 'absolute', left: 65, right: 65, top: 269, height: 979, display: 'flex', alignItems: 'center' }}>
      <Words text="Come home to the story." start={HM.LINE + 4} perWord={4} style={{ font: `400 190px/0.96 ${DISPLAY}`, color: INK_PAPER }} />
    </div>
  </AbsoluteFill>
);

export const HomeAd: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#F7F7F8' }}>
      {frame < HM.APP ? <Chat /> : null}
      {frame >= HM.APP && frame < HM.LINE ? <InTheApp /> : null}
      {frame >= HM.LINE && frame < HM.END ? <Line /> : null}
      {frame >= HM.END ? <EndCard at={HM.END} line="Come home to the story." sub="26 stories to Christmas. Join any day." /> : null}
      <Grain opacity={0.08} />
      <Audio src={staticFile('music/advent-home.mp3')} />
    </AbsoluteFill>
  );
};
