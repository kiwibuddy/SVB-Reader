import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { GEN3 } from '../data/script-gen3';
import { AdShell } from '../lib/AdShell';
import { StatusBar } from '../lib/Phone';
import { Bubble, heightOf, StoryHeader } from '../lib/ReaderBits';
import { SCREEN_START } from '../lib/timeline';
import { light } from '../theme';

const STEP = 26;
const MIX: Array<[string, number]> = [
  [light.narr, 34],
  [light.divine, 30],
  [light.prin, 2],
  [light.chor, 34],
];

const ReaderScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const arrivals = GEN3.map((_, i) => SCREEN_START + i * STEP);
  const heights = GEN3.map(heightOf);
  const cum = (n: number) => heights.slice(0, n).reduce((a, b) => a + b, 0);
  const stackY = interpolate(
    frame,
    arrivals,
    arrivals.map((_, i) => Math.min(0, 700 - cum(i + 1))),
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ background: light.bg }}>
      <StatusBar />
      <StoryHeader title="People Sin" meta="002 · Gen 3:1–5:32 · 8 min" mix={MIX} />
      <div
        style={{
          position: 'absolute',
          left: 34,
          right: 34,
          top: 250,
          height: 760,
          overflow: 'hidden',
          maskImage: 'linear-gradient(to bottom, transparent 0, #000 56px)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 56px)',
        }}
      >
        <div style={{ transform: `translateY(${stackY}px)` }}>
          {GEN3.map((line, i) => (
            <Bubble
              key={i}
              line={line}
              progress={spring({
                frame: frame - arrivals[i],
                fps,
                config: { damping: 200 },
                durationInFrames: 12,
              })}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ScriptAd: React.FC<{ showGuides?: boolean }> = ({ showGuides }) => (
  <AdShell
    hook1="Every word was said by someone."
    hook2="This app shows you who."
    kicker="Every voice in its own colour."
    screen={<ReaderScreen />}
    showGuides={showGuides}
  />
);
