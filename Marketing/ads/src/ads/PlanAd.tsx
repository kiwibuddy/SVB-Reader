import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AdShell, OverlayStat } from '../lib/AdShell';
import { SCREEN_W, StatusBar } from '../lib/Phone';
import { SCREEN_START } from '../lib/timeline';
import { light, SANS } from '../theme';

/**
 * From assets/data/ReadingPlansChallenges.json. Story counts are the real length
 * of each plan's segment list, not the count written in its description — several
 * descriptions disagree with their own data (Paul's Letters says 35 and holds 27,
 * David's Life says 35 and holds 46), so both are left out of this ad until the
 * data is fixed.
 */
const PLANS: Array<[string, string, number]> = [
  ['Bible in 1 year', '365 stories', 365],
  ['Bible in 1 School Year', '180 stories', 180],
  ['New Testament in 100 days', '100 stories', 100],
];

const CHALLENGES: Array<[string, string, number]> = [
  ['God’s Story: The Good News', '7 stories · 1 week', 7],
  ['In The Beginning', '18 stories · 3 weeks', 18],
  ['Women of the Bible', '20 stories · 4 weeks', 20],
  ['The Gospels', '42 stories · 6 weeks', 42],
  ['Advent Journey', '16 stories · 4 weeks', 16],
];

const ACTIVE_DONE = 34;
const ACTIVE_TOTAL = 365;

const CARD_IN = SCREEN_START + 4;
const LIST_IN = SCREEN_START + 40;
const PICK = SCREEN_START + 118; // the week-long challenge lights up

const Row: React.FC<{
  title: string;
  meta: string;
  progress: number;
  highlight?: boolean;
}> = ({ title, meta, progress, highlight }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      padding: '20px 18px',
      marginBottom: 10,
      borderRadius: 20,
      border: `${highlight ? 3 : 1.6}px solid ${highlight ? light.acc : light.hair}`,
      background: highlight ? light.prinFill : light.surf,
      opacity: progress,
      transform: `translateY(${(1 - progress) * 20}px)`,
    }}
  >
    <div style={{ flex: 1 }}>
      <div style={{ font: `600 29px/36px ${SANS}`, color: light.ink }}>{title}</div>
      <div style={{ font: `400 21px/26px ${SANS}`, color: light.mute, marginTop: 3 }}>{meta}</div>
    </div>
    <div
      style={{
        font: `600 22px/26px ${SANS}`,
        color: highlight ? light.acc : light.mute,
        border: `2px solid ${highlight ? light.acc : light.hair}`,
        borderRadius: 999,
        padding: '9px 20px',
      }}
    >
      {highlight ? 'Start' : 'Start'}
    </div>
  </div>
);

/** The plan already running, with its progress bar filling to 34 of 365. */
const ActivePlan: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - CARD_IN, fps, config: { damping: 200 }, durationInFrames: 16 });
  const fill = interpolate(frame, [CARD_IN + 10, CARD_IN + 44], [0, ACTIVE_DONE / ACTIVE_TOTAL], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  const shown = Math.round(fill * ACTIVE_TOTAL);
  return (
    <div
      style={{
        margin: '0 34px 26px',
        padding: '26px 28px',
        borderRadius: 24,
        background: light.narr,
        opacity: p,
        transform: `translateY(${(1 - p) * 24}px)`,
      }}
    >
      <div
        style={{
          font: `500 18px/22px ${SANS}`,
          letterSpacing: 2.4,
          textTransform: 'uppercase',
          color: light.cream,
          opacity: 0.66,
        }}
      >
        Your plan
      </div>
      <div style={{ font: `700 34px/42px ${SANS}`, color: light.cream, marginTop: 8 }}>
        Bible in 1 year
      </div>
      <div
        style={{
          height: 12,
          borderRadius: 6,
          background: `${light.cream}2E`,
          marginTop: 18,
          overflow: 'hidden',
        }}
      >
        <div style={{ height: 12, borderRadius: 6, background: light.prin, width: `${fill * 100}%` }} />
      </div>
      <div style={{ font: `400 23px/28px ${SANS}`, color: light.cream, opacity: 0.82, marginTop: 12 }}>
        {shown} of {ACTIVE_TOTAL} stories · day {shown}
      </div>
    </div>
  );
};

const PlanScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = [...PLANS, ...CHALLENGES];

  return (
    <AbsoluteFill style={{ background: light.bg }}>
      <StatusBar time="6:12" />
      <div style={{ position: 'absolute', left: 34, right: 34, top: 110 }}>
        <div style={{ font: `700 44px/52px ${SANS}`, letterSpacing: -1, color: light.ink }}>Plan</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 190 }}>
        <ActivePlan />
        <div style={{ padding: '0 34px' }}>
          {rows.map(([title, meta], i) => {
            const isChallenge = i >= PLANS.length;
            // A section rule between the long plans and the short challenges.
            const head =
              i === 0 ? 'Plans' : i === PLANS.length ? 'Challenges' : null;
            const p = spring({
              frame: frame - (LIST_IN + i * 6),
              fps,
              config: { damping: 200 },
              durationInFrames: 14,
            });
            const lit =
              isChallenge && title.startsWith('God’s Story')
                ? interpolate(frame, [PICK, PICK + 10], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  })
                : 0;
            return (
              <React.Fragment key={title}>
                {head && (
                  <div
                    style={{
                      font: `500 18px/22px ${SANS}`,
                      letterSpacing: 2.4,
                      textTransform: 'uppercase',
                      color: light.mute,
                      margin: i === 0 ? '0 0 14px' : '26px 0 14px',
                      opacity: p,
                    }}
                  >
                    {head}
                  </div>
                )}
                <Row title={title} meta={meta} progress={p} highlight={lit > 0.5} />
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const PlanAd: React.FC<{ showGuides?: boolean }> = ({ showGuides }) => (
  <AdShell
    hook1="You’ve started the Bible before."
    hook2="This time, pick an ending."
    kicker="Plans and challenges, a week to a year."
    screen={<PlanScreen />}
    overlay={<OverlayStat>Start with seven stories, or all 365.</OverlayStat>}
    overlayAt={342}
    showGuides={showGuides}
  />
);
