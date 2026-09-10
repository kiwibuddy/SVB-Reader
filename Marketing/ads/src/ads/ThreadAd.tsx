import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from 'remotion';
import { AdShell, OverlayStat } from '../lib/AdShell';
import { SCREEN_H, SCREEN_W, StatusBar } from '../lib/Phone';
import { SCREEN_START, T } from '../lib/timeline';
import { light, SANS } from '../theme';

/* constants/divisions.ts — ten divisions, Genesis to Revelation. */
const DIVISIONS: Array<[string, string, number]> = [
  ['The Beginning', 'Genesis – Deuteronomy', 68],
  ['History', 'Joshua – Esther', 86],
  ['Wisdom', 'Job – Song of Songs', 35],
  ['Major Prophets', 'Isaiah – Daniel', 59],
  ['Minor Prophets', 'Hosea – Malachi', 17],
  ['Gospels', 'Matthew – John', 42],
  ['The Church Begins', 'Acts', 12],
  ['Paul’s Letters', 'Romans – Philemon', 27],
  ['Letters to Everyone', 'Hebrews – Jude', 12],
  ['Revelation', 'Revelation', 7],
];

/* assets/data/SegmentReadingTimes.json */
const STORIES: Array<[string, string, number]> = [
  ['God Creates', 'Gen 1:1–2:25', 6],
  ['People Sin', 'Gen 3:1–5:32', 8],
  ['The Flood', 'Gen 6:1–9:29', 10],
  ['The Tower', 'Gen 10:1–11:26', 5],
  ['Abraham Obeys God’s Call', 'Gen 11:27–14:24', 8],
];

const ROW = 92;
const TOP = 250;
const DRAW_START = SCREEN_START + 10;
const OPEN = SCREEN_START + 58;
const SCROLL = SCREEN_START + 100;

const ThreadScreen: React.FC = () => {
  const frame = useCurrentFrame();

  // Beat 3 — The Beginning bows open and its stories appear as beads.
  const open = interpolate(frame, [OPEN, OPEN + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  // Beat 4 — the year runs past.
  const scroll = interpolate(frame, [SCROLL, SCROLL + 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => t * t * (3 - 2 * t),
  });

  const openH = STORIES.length * 78 * open;
  // The ten divisions plus the opened first one very nearly fill the screen, so
  // this is a drift that brings Revelation into view, not a long scroll.
  const listY = -scroll * 150;

  // Beat 2 — the thread draws itself down the gutter.
  const drawn = interpolate(frame, [DRAW_START, DRAW_START + 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const totalH = DIVISIONS.length * ROW + openH;

  return (
    <AbsoluteFill style={{ background: light.bg, overflow: 'hidden' }}>
      <StatusBar />
      <div style={{ position: 'absolute', left: 34, right: 34, top: 110 }}>
        <div style={{ font: `700 44px/52px ${SANS}`, letterSpacing: -1, color: light.ink }}>Read</div>
        <div
          style={{
            font: `500 22px/28px ${SANS}`,
            color: light.mute,
            marginTop: 6,
          }}
        >
          365 stories · 10 divisions
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: TOP,
          height: SCREEN_H - TOP,
          overflow: 'hidden',
          maskImage: 'linear-gradient(to bottom, transparent 0, #000 44px)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 44px)',
        }}
      >
      <div style={{ position: 'relative', height: totalH + 60, transform: `translateY(${listY}px)` }}>
        <svg
          width={SCREEN_W}
          height={totalH + 60}
          style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
        >
          <line
            x1={62}
            y1={0}
            x2={62}
            y2={totalH * drawn}
            stroke={light.thread}
            strokeWidth={3}
          />
        </svg>

        {DIVISIONS.map(([name, books, count], i) => {
          const at = DRAW_START + i * 4;
          const p = spring({ frame: frame - at, fps: 30, config: { damping: 200 }, durationInFrames: 12 });
          const isFirst = i === 0;
          const offset = i === 0 ? 0 : openH;
          return (
            <React.Fragment key={name}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: i * ROW + offset,
                  height: ROW,
                  display: 'flex',
                  alignItems: 'center',
                  opacity: p,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 62 - 11,
                    width: 22,
                    height: 22,
                    border: `3px solid ${isFirst ? light.acc : light.thread}`,
                    background: isFirst ? light.acc : light.bg,
                    transform: 'rotate(45deg)',
                  }}
                />
                <div style={{ paddingLeft: 108, flex: 1 }}>
                  <div style={{ font: `600 32px/38px ${SANS}`, color: light.ink }}>{name}</div>
                  <div
                    style={{
                      font: `500 18px/24px ${SANS}`,
                      letterSpacing: 1.4,
                      textTransform: 'uppercase',
                      color: light.mute,
                      marginTop: 3,
                    }}
                  >
                    {books}
                  </div>
                </div>
                <div style={{ font: `500 26px/32px ${SANS}`, color: light.mute, paddingRight: 34 }}>
                  {count}
                </div>
              </div>

              {isFirst && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: ROW,
                    height: openH,
                    overflow: 'hidden',
                  }}
                >
                  {STORIES.map(([title, ref, mins], s) => {
                    const chipAt = OPEN + 8 + s * 5;
                    const chip = spring({
                      frame: frame - chipAt,
                      fps: 30,
                      config: { damping: 14, mass: 0.7 },
                      durationInFrames: 16,
                    });
                    return (
                      <div
                        key={title}
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: s * 78,
                          height: 78,
                          display: 'flex',
                          alignItems: 'center',
                          opacity: Math.min(1, chip * 1.4),
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: 62 - 8,
                            width: 16,
                            height: 16,
                            borderRadius: 8,
                            border: `3px solid ${light.thread}`,
                            background: light.bg,
                          }}
                        />
                        <div style={{ paddingLeft: 108, flex: 1 }}>
                          <div style={{ font: `500 28px/34px ${SANS}`, color: light.ink }}>{title}</div>
                          <div style={{ font: `400 19px/24px ${SANS}`, color: light.mute, marginTop: 2 }}>
                            {ref}
                          </div>
                        </div>
                        {/* The rhythm of these numbers is the message. */}
                        <div
                          style={{
                            marginRight: 34,
                            transform: `scale(${chip})`,
                            background: light.prinFill,
                            border: `2px solid ${light.prin}`,
                            borderRadius: 999,
                            padding: '8px 20px',
                            font: `700 24px/28px ${SANS}`,
                            color: light.prin,
                          }}
                        >
                          {mins} min
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      </div>
    </AbsoluteFill>
  );
};

export const ThreadAd: React.FC<{ showGuides?: boolean }> = ({ showGuides }) => (
  <AdShell
    hook1="A chapter ends mid-sentence."
    hook2="A story ends when it ends."
    kicker="365 stories. None longer than 15 minutes."
    screen={<ThreadScreen />}
    overlay={<OverlayStat>Know the whole Bible, one ten-minute story at a time.</OverlayStat>}
    overlayAt={334}
    showGuides={showGuides}
  />
);
