import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Line } from '../data/script-gen3';
import { AdShell, OverlayStat } from '../lib/AdShell';
import { StatusBar } from '../lib/Phone';
import { Bubble, heightOf, StoryHeader } from '../lib/ReaderBits';
import { SCREEN_START, T } from '../lib/timeline';
import { INK, light, SANS, type VoiceColor } from '../theme';

/* Story S268, Matthew 8:1–3, verbatim from newBibleNLT1.json. */
const S268: Line[] = [
  {
    speaker: 'The Narrator',
    color: 'black',
    text: 'Large crowds followed Jesus as he came down the mountainside. Suddenly, a man with leprosy approached him and knelt before him.',
  },
  { speaker: 'A Leper', color: 'blue', text: '“Lord,”' },
  { speaker: 'The Narrator', color: 'black', text: 'the man said,' },
  {
    speaker: 'A Leper',
    color: 'blue',
    text: '“if you are willing, you can heal me and make me clean.”',
  },
  { speaker: 'Jesus', color: 'red', text: '“I am willing,”' },
];

const MIX: Array<[string, number]> = [
  [light.narr, 42],
  [light.divine, 48],
  [light.prin, 1],
  [light.chor, 9],
];

const ORDER: VoiceColor[] = ['black', 'red', 'green', 'blue'];
const NAMES = ['Dad', 'Mum', 'Ana', 'Sam'];

const TAP_1 = SCREEN_START + 6;
const TAP_STEP = 12;
const READ = SCREEN_START + 62;
const STEP = 20;
const DIM_ON = READ + 26;
const DIM_OFF = READ + 74;

/** The call sheet: four boxes, four taps, and nothing else to configure. */
const CallSheet: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: 'absolute',
        left: 34,
        right: 34,
        top: 268,
        border: `2px solid ${light.hair}`,
        borderRadius: 24,
        background: light.surf,
        padding: '22px 24px',
      }}
    >
      <div
        style={{
          font: `500 18px/22px ${SANS}`,
          letterSpacing: 2.2,
          textTransform: 'uppercase',
          color: light.mute,
          marginBottom: 18,
        }}
      >
        15 voices · take a colour
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {ORDER.map((c, i) => {
          const at = TAP_1 + i * TAP_STEP;
          const taken = spring({
            frame: frame - at,
            fps,
            config: { damping: 200 },
            durationInFrames: 10,
          });
          // A ring pushes out from the tap and fades — the whole interaction.
          const ring = interpolate(frame, [at, at + 16], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div key={c} style={{ flex: 1, textAlign: 'center' }}>
              <div
                style={{
                  position: 'relative',
                  height: 92,
                  borderRadius: 20,
                  borderTopLeftRadius: 8,
                  background: taken > 0.1 ? `${INK[c]}1A` : light.bg,
                  border: `${taken > 0.1 ? 3 : 2}px solid ${taken > 0.1 ? INK[c] : light.hair}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: ring > 0 && ring < 1 ? `0 0 0 ${(1 - ring) * 26}px ${INK[c]}1A` : 'none',
                }}
              >
                <svg width="42" height="42" viewBox="0 0 24 24" style={{ transform: `scale(${taken})` }}>
                  <path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    fill="none"
                    stroke={INK[c]}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div
                style={{
                  font: `600 22px/28px ${SANS}`,
                  color: INK[c],
                  marginTop: 10,
                  opacity: taken,
                }}
              >
                {NAMES[i]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ColourScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const arrivals = S268.map((_, i) => READ + i * STEP);
  const heights = S268.map(heightOf);
  const cum = (n: number) => heights.slice(0, n).reduce((a, b) => a + b, 0);
  const stackY = interpolate(
    frame,
    arrivals,
    arrivals.map((_, i) => Math.min(0, 470 - cum(i + 1))),
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Everything but the blue reader's turns dims — what a reader watching for
  // their own colour actually sees.
  const dim = interpolate(frame, [DIM_ON, DIM_ON + 12, DIM_OFF, DIM_OFF + 12], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: light.bg }}>
      <StatusBar time="7:27" />
      <StoryHeader
        title="Prepared to Extend the Kingdom"
        meta="268 · Mat 8:1–11:1 · 12 min"
        mix={MIX}
      />
      <CallSheet />
      <div
        style={{
          position: 'absolute',
          left: 34,
          right: 34,
          top: 500,
          height: 520,
          overflow: 'hidden',
          maskImage: 'linear-gradient(to bottom, transparent 0, #000 46px)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 46px)',
        }}
      >
        <div style={{ transform: `translateY(${stackY}px)` }}>
          {S268.map((line, i) => {
            const mine = line.color === 'blue';
            return (
              <Bubble
                key={i}
                line={line}
                progress={spring({
                  frame: frame - arrivals[i],
                  fps,
                  config: { damping: 200 },
                  durationInFrames: 12,
                })}
                dim={!mine && dim > 0.5}
                glow={mine && dim > 0.5}
              />
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ColourAd: React.FC<{ showGuides?: boolean }> = ({ showGuides }) => (
  <AdShell
    hook1="Pick a story. Gather three friends."
    hook2="Read your colour parts out loud."
    kicker="Four readers. One story. Out loud."
    screen={<ColourScreen />}
    overlay={<OverlayStat>See the Bible come alive as you read it together.</OverlayStat>}
    overlayAt={336}
    showGuides={showGuides}
  />
);
