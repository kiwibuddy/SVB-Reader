import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AdShell, OverlayStat } from '../lib/AdShell';
import { SCREEN_W, StatusBar } from '../lib/Phone';
import { SCREEN_START } from '../lib/timeline';
import { light, SANS } from '../theme';

/* constants/divisions.ts — story counts per division, summing to 365. */
const DIVISIONS: Array<[string, number]> = [
  ['The Beginning', 68],
  ['History', 86],
  ['Wisdom', 35],
  ['Major Prophets', 59],
  ['Minor Prophets', 17],
  ['Gospels', 42],
  ['The Church Begins', 12],
  ['Paul’s Letters', 27],
  ['Letters to Everyone', 12],
  ['Revelation', 7],
];

/* An illustrative reading state, not a claim: 128 of 365 read, 14-day streak. */
const DONE = 128;
const STREAK = 14;
const VOICES = 214;

const DOT = 13;
const GAP = 4;
const LABEL_W = 168;
const PAD = 30;
const DOT_AREA = SCREEN_W - PAD * 2 - LABEL_W;
const PER_LINE = Math.floor((DOT_AREA + GAP) / (DOT + GAP));

const FILL_START = SCREEN_START + 6;
const FILL_END = FILL_START + 78;
const RINGS = FILL_END - 20;

const Ring: React.FC<{
  progress: number;
  primary: string;
  secondary?: string;
  label: string;
  color: string;
}> = ({ progress, primary, secondary, label, color }) => {
  const R = 56;
  const C = 2 * Math.PI * R;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={138} height={138} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={69} cy={69} r={R} fill="none" stroke={light.hair} strokeWidth={11} />
        <circle
          cx={69}
          cy={69}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={11}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress)}
        />
      </svg>
      <div style={{ marginTop: -96, textAlign: 'center', height: 96 }}>
        <div style={{ font: `700 36px/40px ${SANS}`, color: light.ink, letterSpacing: -1 }}>
          {primary}
        </div>
        {secondary && (
          <div style={{ font: `400 19px/23px ${SANS}`, color: light.mute }}>{secondary}</div>
        )}
      </div>
      <div
        style={{
          marginTop: 12,
          font: `500 19px/24px ${SANS}`,
          letterSpacing: 1.6,
          textTransform: 'uppercase',
          color: light.mute,
        }}
      >
        {label}
      </div>
    </div>
  );
};

const YouScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Stories fill in reading order, which is what a plan reader actually sees.
  const filled = Math.round(
    interpolate(frame, [FILL_START, FILL_END], [0, DONE], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: (t) => 1 - Math.pow(1 - t, 2.2),
    })
  );

  const ringP = spring({ frame: frame - RINGS, fps, config: { damping: 200 }, durationInFrames: 34 });

  let offset = 0;

  return (
    <AbsoluteFill style={{ background: light.bg }}>
      <StatusBar time="9:41" />
      <div style={{ position: 'absolute', left: PAD, right: PAD, top: 110 }}>
        <div style={{ font: `700 44px/52px ${SANS}`, letterSpacing: -1, color: light.ink }}>You</div>
        <div style={{ font: `500 22px/28px ${SANS}`, color: light.mute, marginTop: 4 }}>
          Your reading, all of it
        </div>
      </div>

      <div style={{ position: 'absolute', left: PAD, right: PAD, top: 220 }}>
        {DIVISIONS.map(([name, count]) => {
          const start = offset;
          offset += count;
          const lines = Math.ceil(count / PER_LINE);
          const doneHere = Math.max(0, Math.min(count, filled - start));
          return (
            <div key={name} style={{ display: 'flex', marginBottom: 8, alignItems: 'flex-start' }}>
              <div style={{ width: LABEL_W, paddingRight: 14 }}>
                <div style={{ font: `600 20px/25px ${SANS}`, color: light.mute }}>{name}</div>
                <div style={{ font: `400 18px/22px ${SANS}`, color: light.mute, opacity: 0.75 }}>
                  {doneHere}/{count}
                </div>
              </div>
              <div
                style={{
                  width: DOT_AREA,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: GAP,
                  minHeight: lines * (DOT + GAP),
                }}
              >
                {Array.from({ length: count }, (_, i) => {
                  const read = i < doneHere;
                  // The newest dot pulses, the way the current story does in-app.
                  const isCurrent = i === doneHere - 1;
                  return (
                    <div
                      key={i}
                      style={{
                        width: DOT,
                        height: DOT,
                        borderRadius: DOT / 2,
                        background: read ? light.acc : light.bg,
                        border: read ? 'none' : `2px solid ${light.thread}`,
                        boxShadow: isCurrent ? `0 0 0 5px ${light.acc}33` : 'none',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          left: PAD,
          right: PAD,
          top: 820,
          display: 'flex',
          gap: 10,
          opacity: ringP,
          transform: `translateY(${(1 - ringP) * 26}px)`,
        }}
      >
        <Ring
          progress={ringP * (DONE / 365)}
          primary={`${Math.round(ringP * DONE)}`}
          secondary="/ 365"
          label="Stories"
          color={light.acc}
        />
        <Ring
          progress={ringP}
          primary={`${Math.round(ringP * VOICES)}`}
          label="Voices met"
          color={light.chor}
        />
        <Ring
          progress={ringP * Math.min(STREAK / 30, 1)}
          primary={`${Math.round(ringP * STREAK)}`}
          secondary="day streak"
          label="Streak"
          color={light.divine}
        />
      </div>
    </AbsoluteFill>
  );
};

export const YouAd: React.FC<{ showGuides?: boolean }> = ({ showGuides }) => (
  <AdShell
    hook1="You’ve read more than you think."
    hook2="Here’s the proof."
    kicker="Every story you finish, on one screen."
    screen={<YouScreen />}
    overlay={<OverlayStat>The whole Bible on one screen, filling in as you go.</OverlayStat>}
    overlayAt={338}
    showGuides={showGuides}
  />
);
