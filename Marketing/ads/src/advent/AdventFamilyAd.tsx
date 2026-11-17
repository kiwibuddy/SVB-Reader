import React from 'react';
import { useCurrentFrame } from 'remotion';
import { AdventShell, Statement } from './AdventShell';
import { ANNUNCIATION } from './data';
import { InviteCard, Journey, journeyItems, PartsReader, PlanFrame } from './screens';
import { A_START, B_START } from './timeline';

const TAP = A_START + 150;

/** Screen A: the Advent card on the Plan tab, the week ahead, and a tap on Join. */
const JoinScreen: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <PlanFrame>
      <div style={{ position: 'absolute', left: 34, right: 34, top: 186 }}>
        <InviteCard appearAt={A_START} tapAt={TAP} />
      </div>
      <div style={{ position: 'absolute', left: 34, right: 34, top: 516 }}>
        <Journey
          items={journeyItems(['hope'])}
          appearAt={A_START + 34}
          stagger={9}
          current={frame > TAP + 22 ? 'S365' : undefined}
        />
      </div>
    </PlanFrame>
  );
};

/**
 * Screen B: Luke 1:28–30, verbatim. A family of four takes the four parts —
 * three share the narration, one reads the angel — and this phone belongs to
 * the one reading Gabriel.
 */
const ReadScreen: React.FC = () => (
  <PartsReader
    story={ANNUNCIATION}
    lines={ANNUNCIATION.lines}
    names={['Dad', 'Mum', 'Gran', 'Ana']}
    pick={3}
    namesAt={B_START}
    pickAt={B_START + 26}
    readAt={B_START + 44}
    step={30}
  />
);

export const AdventFamilyAd: React.FC<{ showGuides?: boolean }> = ({ showGuides }) => (
  <AdventShell
    hook1="Advent starts Sunday, 29 November."
    hook2="Read it together, out loud."
    kickerA="One story a day to Christmas Eve."
    kickerB="Everyone takes a part."
    screenA={<JoinScreen />}
    screenB={<ReadScreen />}
    statement={
      <Statement sub="Four questions for families follow every story.">
        Ten minutes after dinner, every night to Christmas Eve.
      </Statement>
    }
    showGuides={showGuides}
  />
);
