import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { AdventShell, Statement } from './AdventShell';
import { ISAIAH } from './data';
import { itemHeight, Journey, journeyItems, PartsReader, PlanFrame } from './screens';
import { A_START, AT, B_START } from './timeline';

/**
 * Screen A: Isaiah 6:1–11 as the app shows it, read from 6:7 to "Here I am. Send me." A small group takes the four parts —
 * narrator, God, Isaiah, the seraphim — and this phone is reading Isaiah, so
 * the last turn it lights is "Here I am. Send me."
 */
const ReadScreen: React.FC = () => (
  <PartsReader
    story={ISAIAH}
    lines={ISAIAH.lines}
    readFrom={6}
    names={['Jo', 'Sam', 'Priya', 'Tom']}
    pick={2}
    namesAt={A_START}
    pickAt={A_START + 34}
    readAt={A_START + 56}
    step={34}
  />
);

const ALL = journeyItems(['hope', 'peace', 'joy', 'love']);
const TOTAL_H = ALL.reduce((sum, it) => sum + itemHeight(it), 0);
const VISIBLE_H = 1100;

/** Screen B: the whole journey scrolls past, Sundays lit in their week's colour. */
const WeeksScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const scroll = interpolate(frame, [B_START + 18, AT.STATEMENT - 6], [0, TOTAL_H - VISIBLE_H], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  });
  const glow = interpolate(frame, [B_START + 6, B_START + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <PlanFrame title="Advent Journey">
      <div style={{ position: 'absolute', left: 34, right: 34, top: 186, bottom: 0, overflow: 'hidden' }}>
        <Journey items={ALL} appearAt={B_START} stagger={1} scrollY={scroll} sundayGlow={glow} />
      </div>
    </PlanFrame>
  );
};

export const AdventGroupsAd: React.FC<{ showGuides?: boolean }> = ({ showGuides }) => (
  <AdventShell
    hook1="From promise to manger in 26 days."
    hook2="Read it in fours, out loud."
    kickerA="Four parts. Four readers. One story."
    kickerB="Four weeks: Hope, Peace, Joy, Love."
    screenA={<ReadScreen />}
    screenB={<WeeksScreen />}
    statement={
      <Statement sub="Questions for small groups follow every story.">
        Split into fours. Take a part. Read it out loud.
      </Statement>
    }
    music="music/advent-piano-cello.mp3"
    showGuides={showGuides}
  />
);
