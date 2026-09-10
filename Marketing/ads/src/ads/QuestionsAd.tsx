import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { FLOOD } from '../data/questions-s003';
import { AdShell, OverlayStat } from '../lib/AdShell';
import { SCREEN_W, StatusBar } from '../lib/Phone';
import { StoryHeader } from '../lib/ReaderBits';
import { SCREEN_START } from '../lib/timeline';
import { light, SANS } from '../theme';

/* Story S003, The Flood — colour mix is illustrative of a narration-heavy story. */
const MIX: Array<[string, number]> = [
  [light.narr, 74],
  [light.divine, 22],
  [light.prin, 3],
  [light.chor, 1],
];

/** Card sits 34px inside the screen and pads 30px again, so pills fit this. */
const CARD_INNER = SCREEN_W - 34 * 2 - 30 * 2;

const FIRST = SCREEN_START + 8;
const HOLD = 48; // each audience is on screen this long
const at = (i: number) => FIRST + i * HOLD;

/** The audience pills. The active one slides rather than cutting, so the eye
    follows the selection instead of re-reading the row each time. */
const Pills: React.FC<{ active: number }> = ({ active }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Smoothly chase the active index so the pill travels between positions.
  let pos = 0;
  for (let i = 1; i < FLOOD.length; i += 1) {
    pos += spring({
      frame: frame - at(i),
      fps,
      config: { damping: 200 },
      durationInFrames: 14,
    });
  }
  const W = (CARD_INNER - 16) / 3;
  return (
    <div style={{ position: 'relative', height: 62, marginBottom: 26 }}>
      <div
        style={{
          position: 'absolute',
          left: pos * (W + 8),
          top: 0,
          width: W,
          height: 62,
          borderRadius: 999,
          background: light.acc,
        }}
      />
      <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
        {FLOOD.map((a, i) => (
          <div
            key={a.label}
            style={{
              width: W,
              height: 62,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              border: `1.8px solid ${light.hair}`,
              font: `600 24px/28px ${SANS}`,
              color: i === active ? light.surf : light.mute,
            }}
          >
            {a.label}
          </div>
        ))}
      </div>
    </div>
  );
};

const TalkAboutCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let active = 0;
  for (let i = 0; i < FLOOD.length; i += 1) if (frame >= at(i)) active = i;

  return (
    <div
      style={{
        position: 'absolute',
        left: 34,
        right: 34,
        top: 268,
        border: `2px solid ${light.hair}`,
        borderRadius: 28,
        background: light.surf,
        padding: '28px 30px 34px',
        boxShadow: '0 10px 30px rgba(16,22,25,0.06)',
      }}
    >
      <div
        style={{
          font: `500 19px/24px ${SANS}`,
          letterSpacing: 2.6,
          textTransform: 'uppercase',
          color: light.mute,
          marginBottom: 20,
        }}
      >
        Talk about it
      </div>

      <Pills active={active} />

      {/* Only the active set is mounted; each swap plays as a fresh stagger. */}
      <div style={{ position: 'relative', minHeight: 420 }}>
        {FLOOD.map((a, ai) =>
          ai === active
            ? a.questions.map((q, qi) => {
                const p = spring({
                  frame: frame - (at(ai) + 4 + qi * 6),
                  fps,
                  config: { damping: 200 },
                  durationInFrames: 14,
                });
                return (
                  <div
                    key={`${ai}-${qi}`}
                    style={{
                      display: 'flex',
                      gap: 20,
                      marginBottom: 26,
                      opacity: p,
                      transform: `translateY(${(1 - p) * 22}px)`,
                    }}
                  >
                    <div
                      style={{
                        flex: 'none',
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        background: light.prinFill,
                        border: `2px solid ${light.prin}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        font: `700 24px/28px ${SANS}`,
                        color: light.prin,
                      }}
                    >
                      {qi + 1}
                    </div>
                    <div style={{ font: `400 32px/44px ${SANS}`, color: light.ink, flex: 1 }}>{q}</div>
                  </div>
                );
              })
            : null
        )}
      </div>
    </div>
  );
};

const QuestionsScreen: React.FC = () => (
  <AbsoluteFill style={{ background: light.bg }}>
    <StatusBar time="8:04" />
    <StoryHeader title="The Flood" meta="003 · Gen 6:1–9:29 · 10 min" mix={MIX} />
    <TalkAboutCard />
  </AbsoluteFill>
);

export const QuestionsAd: React.FC<{ showGuides?: boolean }> = ({ showGuides }) => (
  <AdShell
    hook1="Someone has to lead the discussion."
    hook2="The questions are already written."
    kicker="Family, school or small group. One tap."
    screen={<QuestionsScreen />}
    overlay={<OverlayStat>Every story comes with questions for the room you’re in.</OverlayStat>}
    overlayAt={352}
    showGuides={showGuides}
  />
);
