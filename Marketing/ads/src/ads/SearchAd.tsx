import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Line } from '../data/script-gen3';
import { AdShell, OverlayStat } from '../lib/AdShell';
import { SCREEN_H, SCREEN_W, StatusBar } from '../lib/Phone';
import { Bubble, StoryHeader } from '../lib/ReaderBits';
import { SCREEN_START } from '../lib/timeline';
import { light, SANS } from '../theme';

/* John 3:16 falls inside story S299, "The First Sign", Joh 2:1–4:42, 10 min —
   confirmed against SegmentReadingTimes.json. Opening lines verbatim from
   newBibleNLT1.json via scripts/dump-segment.mjs. */
const QUERY = 'John 3:16';

const S299: Line[] = [
  {
    speaker: 'The Narrator',
    color: 'black',
    text: 'The next day there was a wedding celebration in the village of Cana in Galilee.',
  },
  { speaker: 'Mary Mother of Jesus', color: 'blue', text: '“They have no more wine.”' },
  { speaker: 'Jesus', color: 'red', text: '“Dear woman, that’s not our problem,”' },
];

const MIX: Array<[string, number]> = [
  [light.narr, 46],
  [light.divine, 34],
  [light.prin, 2],
  [light.chor, 18],
];

const TYPE_START = SCREEN_START + 4;
const PER_CHAR = 3;
const TYPED_END = TYPE_START + QUERY.length * PER_CHAR;
const RESULT = TYPED_END + 6;
const TAP = RESULT + 44;
const OPEN = TAP + 8;

/** The Read tab's search field, mid-query. */
const SearchScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chars = Math.max(
    0,
    Math.min(QUERY.length, Math.floor((frame - TYPE_START) / PER_CHAR))
  );
  const typed = QUERY.slice(0, chars);
  const caret = Math.floor(frame / 8) % 2 === 0;

  const res = spring({ frame: frame - RESULT, fps, config: { damping: 200 }, durationInFrames: 16 });
  const tap = interpolate(frame, [TAP, TAP + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: light.bg }}>
      <StatusBar time="7:02" />
      <div style={{ position: 'absolute', left: 34, right: 34, top: 108 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            height: 78,
            padding: '0 24px',
            borderRadius: 20,
            background: light.surf,
            border: `2px solid ${chars > 0 ? light.acc : light.hair}`,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={light.mute} strokeWidth="2.4">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <div style={{ font: `400 30px/36px ${SANS}`, color: chars ? light.ink : light.mute }}>
            {chars ? typed : 'Search stories, people, references'}
            {caret && chars > 0 && (
              <span style={{ color: light.acc, marginLeft: 2 }}>|</span>
            )}
          </div>
        </div>

        {/* The reference hit, which is the whole point of the ad. */}
        <div
          style={{
            marginTop: 26,
            opacity: res,
            transform: `translateY(${(1 - res) * 24}px) scale(${1 - tap * 0.02})`,
            border: `3px solid ${light.acc}`,
            background: tap > 0.5 ? light.prinFill : light.surf,
            borderRadius: 24,
            padding: '26px 28px',
          }}
        >
          <div
            style={{
              font: `500 18px/22px ${SANS}`,
              letterSpacing: 2.4,
              textTransform: 'uppercase',
              color: light.acc,
            }}
          >
            Verse reference
          </div>
          <div style={{ font: `700 38px/46px ${SANS}`, color: light.ink, marginTop: 10 }}>
            The First Sign
          </div>
          <div style={{ font: `400 24px/30px ${SANS}`, color: light.mute, marginTop: 4 }}>
            John 2:1–4:42 · 10 min · story 299
          </div>
        </div>

        <div style={{ marginTop: 34, opacity: res * 0.9 }}>
          <div
            style={{
              font: `500 18px/22px ${SANS}`,
              letterSpacing: 2.4,
              textTransform: 'uppercase',
              color: light.mute,
              marginBottom: 14,
            }}
          >
            Also in John
          </div>
          {[
            ['God Came to Us', 'John 1:1–1:51 · 5 min'],
            ['Four More Signs', 'John 4:43–6:71 · 12 min'],
          ].map(([t, m]) => (
            <div
              key={t}
              style={{
                padding: '18px 4px',
                borderBottom: `1.4px solid ${light.hair}`,
              }}
            >
              <div style={{ font: `500 28px/34px ${SANS}`, color: light.ink }}>{t}</div>
              <div style={{ font: `400 20px/26px ${SANS}`, color: light.mute, marginTop: 2 }}>{m}</div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** What the reference actually opens into. */
const StoryScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slide = spring({ frame: frame - OPEN, fps, config: { damping: 30, mass: 0.9 }, durationInFrames: 26 });
  if (slide <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: SCREEN_W,
        height: SCREEN_H,
        background: light.bg,
        transform: `translateX(${(1 - slide) * SCREEN_W}px)`,
        boxShadow: '-20px 0 50px rgba(16,22,25,0.14)',
      }}
    >
      <StatusBar time="7:02" />
      <StoryHeader title="The First Sign" meta="299 · John 2:1–4:42 · 10 min" mix={MIX} />
      <div style={{ position: 'absolute', left: 34, right: 34, top: 262 }}>
        {S299.map((line, i) => (
          <Bubble
            key={i}
            line={line}
            progress={spring({
              frame: frame - (OPEN + 14 + i * 12),
              fps,
              config: { damping: 200 },
              durationInFrames: 12,
            })}
          />
        ))}
      </div>
    </div>
  );
};

const SearchAdScreen: React.FC = () => (
  <AbsoluteFill style={{ background: light.bg, overflow: 'hidden' }}>
    <SearchScreen />
    <StoryScreen />
  </AbsoluteFill>
);

export const SearchAd: React.FC<{ showGuides?: boolean }> = ({ showGuides }) => (
  <AdShell
    hook1="You still think in chapter and verse."
    hook2="Type it. We’ll find the story."
    kicker="Search a reference, a person, or a story."
    screen={<SearchAdScreen />}
    overlay={<OverlayStat>Your reference still works. What’s around it is new.</OverlayStat>}
    overlayAt={344}
    showGuides={showGuides}
  />
);
