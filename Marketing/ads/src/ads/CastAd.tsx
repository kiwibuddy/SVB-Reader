import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AdShell, OverlayStat } from '../lib/AdShell';
import { SCREEN_H, SCREEN_W, StatusBar } from '../lib/Phone';
import { SCREEN_START, T } from '../lib/timeline';
import { INK, light, SANS, SERIF } from '../theme';

/* All figures from assets/data/conversations.json, read 1 Sep 2026.
   Jesus is rank 002 of 769 by word count once the four narration voices
   are excluded, which is exactly how the Cast screen counts. */
const JESUS = { words: 41239, turns: 716, stories: 47 };

const SPOKE_WITH: Array<[string, number, keyof typeof INK]> = [
  ['The Disciples', 94, 'green'],
  ['Simon Peter', 68, 'green'],
  ['The Crowd', 63, 'blue'],
  ['Jewish Leaders', 60, 'blue'],
  ['The Pharisees', 33, 'blue'],
];
const MAX = 94;

const CAST_LIST: Array<[string, string, number, keyof typeof INK]> = [
  ['God', 'Divine', 140659, 'red'],
  ['Jesus', 'Divine', 41239, 'red'],
  ['Moses', 'Main', 30310, 'green'],
  ['David', 'Main', 29139, 'green'],
  ['Solomon', 'Main', 11612, 'green'],
  ['An Unnamed Psalmist', 'Supporting', 11599, 'blue'],
];

const TAP = SCREEN_START + 16;
const WIPE = TAP + 6;
const CARD = WIPE + 16;

/** Beat 1 — the Cast index, so the length of the list registers before the tap. */
const CastIndex: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: light.bg }}>
      <StatusBar time="5:39" />
      <div style={{ position: 'absolute', left: 34, right: 34, top: 110 }}>
        <div style={{ font: `700 44px/52px ${SANS}`, letterSpacing: -1, color: light.ink }}>Cast</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {['Main', 'Supporting', 'Divine', 'All'].map((p, i) => (
            <div
              key={p}
              style={{
                font: `600 20px/24px ${SANS}`,
                color: i === 3 ? light.surf : light.mute,
                background: i === 3 ? light.acc : 'transparent',
                border: `1.6px solid ${i === 3 ? light.acc : light.hair}`,
                borderRadius: 999,
                padding: '10px 20px',
              }}
            >
              {p}
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 34, right: 34, top: 250 }}>
        {CAST_LIST.map(([name, group, words, color], i) => {
          const p = spring({
            frame: frame - (SCREEN_START + i * 5),
            fps: 30,
            config: { damping: 200 },
            durationInFrames: 12,
          });
          const tapping = name === 'Jesus' ? interpolate(frame, [TAP, TAP + 8], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }) : 0;
          return (
            <div
              key={name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: '22px 14px',
                borderBottom: `1.4px solid ${light.hair}`,
                opacity: p,
                background: `rgba(192,38,26,${tapping * 0.09})`,
                borderRadius: 16,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  background: INK[color],
                  flex: 'none',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ font: `600 30px/36px ${SANS}`, color: light.ink }}>{name}</div>
                <div
                  style={{
                    font: `500 18px/22px ${SANS}`,
                    letterSpacing: 1.6,
                    textTransform: 'uppercase',
                    color: light.mute,
                    marginTop: 3,
                  }}
                >
                  {group}
                </div>
              </div>
              <div style={{ font: `500 24px/28px ${SANS}`, color: light.mute }}>
                {words.toLocaleString('en-US')}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Beats 2–4 — the divine-red field, the counter, and the bars. */
const JesusCard: React.FC = () => {
  const frame = useCurrentFrame();
  const cream = light.cream;

  // The field wipes up from the tapped row and takes the whole screen.
  const wipe = interpolate(frame, [WIPE, WIPE + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  if (wipe <= 0) return null;

  const count = Math.round(
    interpolate(frame, [CARD + 12, CARD + 46], [0, JESUS.words], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: (t) => 1 - Math.pow(1 - t, 3),
    })
  );
  const turns = Math.round(
    interpolate(frame, [CARD + 12, CARD + 46], [0, JESUS.turns], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: (t) => 1 - Math.pow(1 - t, 3),
    })
  );

  const label: React.CSSProperties = {
    font: `500 19px/24px ${SANS}`,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: cream,
    opacity: 0.7,
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: SCREEN_W,
        height: SCREEN_H,
        background: '#B4231A',
        clipPath: `inset(${(1 - wipe) * 100}% 0 0 0)`,
      }}
    >
      <StatusBarCream />
      <div style={{ position: 'absolute', left: 40, right: 40, top: 120 }}>
        <div style={{ ...label, opacity: fade(frame, CARD, 0.7) }}>Divine voice · 002 of 769</div>
        <div
          style={{
            font: `400 96px/104px ${SERIF}`,
            color: cream,
            letterSpacing: -2,
            marginTop: 10,
            opacity: fade(frame, CARD + 4, 1),
          }}
        >
          Jesus
        </div>
        <div
          style={{
            font: `400 30px/44px ${SANS}`,
            color: cream,
            opacity: 0.94 * fade(frame, CARD + 10, 1),
            marginTop: 22,
          }}
        >
          {count.toLocaleString('en-US')} words across {turns.toLocaleString('en-US')} turns,
          <br />
          in {JESUS.stories} of the 365 stories.
        </div>

        <div style={{ ...label, marginTop: 46, opacity: fade(frame, CARD + 40, 0.7) }}>Spoke with</div>
        <div style={{ marginTop: 12 }}>
          {SPOKE_WITH.map(([name, n, color], i) => {
            const at = CARD + 46 + i * 6;
            const grow = interpolate(frame, [at, at + 18], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: (t) => 1 - Math.pow(1 - t, 3),
            });
            return (
              <div
                key={name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  height: 74,
                  borderTop: `1.4px solid ${cream}33`,
                  opacity: fade(frame, at, 1),
                }}
              >
                <div style={{ font: `400 27px/34px ${SANS}`, color: cream, width: 250 }}>{name}</div>
                <div style={{ flex: 1, height: 12, background: `${cream}2E`, borderRadius: 6 }}>
                  <div
                    style={{
                      height: 12,
                      borderRadius: 6,
                      background: INK[color],
                      width: `${(n / MAX) * 100 * grow}%`,
                    }}
                  />
                </div>
                <div style={{ font: `600 26px/32px ${SANS}`, color: cream, width: 54, textAlign: 'right' }}>
                  {Math.round(n * grow)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StatusBarCream: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 94,
      display: 'flex',
      alignItems: 'center',
      padding: '0 60px',
      font: `600 27px/1 ${SANS}`,
      color: light.cream,
    }}
  >
    5:39
  </div>
);

const fade = (frame: number, at: number, to: number) =>
  interpolate(frame, [at, at + 12], [0, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const CastScreen: React.FC = () => (
  <AbsoluteFill style={{ background: light.bg }}>
    <CastIndex />
    <JesusCard />
  </AbsoluteFill>
);

export const CastAd: React.FC<{ showGuides?: boolean }> = ({ showGuides }) => (
  <AdShell
    hook1="The Bible has a cast list."
    hook2="Over 700 people speak in it."
    kicker="Everyone who speaks, and who they spoke to."
    screen={<CastScreen />}
    overlay={<OverlayStat>See who speaks with whom, and follow the relationship.</OverlayStat>}
    overlayAt={324}
    showGuides={showGuides}
  />
);
