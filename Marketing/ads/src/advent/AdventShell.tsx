import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BrandLockup, DownloadCTA } from '../lib/Brand';
import { Phone, PHONE_W } from '../lib/Phone';
import { SafeArea, SafeZones } from '../lib/safe';
import { ColourRule, RevealLine } from '../lib/Type';
import { dark, H, light, SAFE_BOX, SANS, W } from '../theme';
import { ADVENT, AT } from './timeline';

const RULE = [light.narr, light.divine, light.prin, light.chor];
const RULE_DARK = [dark.narr, dark.divine, dark.prin, dark.chor];

const PHONE_X = (W - PHONE_W) / 2;
const PHONE_REST_Y = 486;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/**
 * The 30-second Advent spine. Same opening and close as the 2.0 set
 * (lib/AdShell.tsx), with room for two screens on the device and an Advent
 * end card. See ADVENT.md for the beat map.
 */
export const AdventShell: React.FC<{
  hook1: string;
  hook2: string;
  kickerA: string;
  kickerB: string;
  screenA: React.ReactNode;
  screenB: React.ReactNode;
  statement: React.ReactNode;
  showGuides?: boolean;
}> = ({ hook1, hook2, kickerA, kickerB, screenA, screenB, statement, showGuides }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const morph = interpolate(frame, [AT.TITLE_HOLD, AT.MORPH_END], [0, 1], {
    ...clamp,
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });

  const rise = spring({ frame: frame - AT.PHONE_IN, fps, config: { damping: 26, mass: 1.1 }, durationInFrames: 44 });
  const leave = spring({ frame: frame - AT.PHONE_OUT, fps, config: { damping: 200 }, durationInFrames: 22 });
  const drift = interpolate(frame, [AT.PHONE_IN, AT.PHONE_OUT], [0, -40], clamp);
  const phoneY = interpolate(rise, [0, 1], [H + 60, PHONE_REST_Y]) + drift + leave * (H + 200);
  const tilt = interpolate(rise, [0, 1], [4.5, 0]) + leave * 5;

  // Screen A hands over to screen B with a short lateral slide, the way the
  // app moves between tabs.
  const swap = interpolate(frame, [AT.SWAP, AT.SWAP + 16], [0, 1], { ...clamp, easing: (t) => t * t * (3 - 2 * t) });

  const hookOut = interpolate(frame, [AT.PHONE_IN - 14, AT.PHONE_IN + 2], [0, 1], clamp);
  const kickerIn = interpolate(frame, [AT.PHONE_IN + 4, AT.PHONE_IN + 18], [0, 1], clamp);
  const statementIn = interpolate(frame, [AT.STATEMENT, AT.STATEMENT + 16], [0, 1], clamp);
  const ctaIn = spring({ frame: frame - AT.CTA, fps, config: { damping: 200 }, durationInFrames: 20 });

  const kicker = (text: string, opacity: number) => (
    <div
      style={{
        position: 'absolute',
        top: 116,
        left: 0,
        right: 0,
        opacity,
        font: `600 42px/52px ${SANS}`,
        letterSpacing: -0.8,
        color: light.ink,
      }}
    >
      {text}
    </div>
  );

  return (
    <AbsoluteFill style={{ background: light.bg }}>
      <SafeArea>
        <BrandLockup morph={morph} boxWidth={SAFE_BOX.width} />

        <div style={{ position: 'absolute', top: 88, left: 0, opacity: morph }}>
          <ColourRule
            width={SAFE_BOX.width}
            progress={interpolate(frame, [AT.MORPH_END - 6, AT.MORPH_END + 14], [0, 1], clamp)}
            colors={RULE}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            top: 748,
            left: (SAFE_BOX.width - 420) / 2,
            opacity: 1 - Math.min(1, morph * 2),
          }}
        >
          <ColourRule width={420} progress={interpolate(frame, [16, 40], [0, 1], clamp)} colors={RULE} />
        </div>

        <div
          style={{
            position: 'absolute',
            top: 138,
            left: 0,
            right: 0,
            opacity: 1 - hookOut,
            transform: `translateY(${hookOut * -70}px)`,
          }}
        >
          <RevealLine text={hook1} start={AT.HOOK_1} size={88} leading={102} color={light.ink} />
          <div style={{ height: 26 }} />
          <RevealLine text={hook2} start={AT.HOOK_2} size={88} leading={102} color={ADVENT.purple} />
        </div>

        {kicker(kickerA, kickerIn * (1 - swap) * (1 - leave) * (1 - statementIn))}
        {kicker(kickerB, swap * (1 - leave) * (1 - statementIn))}
      </SafeArea>

      <Phone x={PHONE_X} y={phoneY} tilt={tilt}>
        <AbsoluteFill style={{ opacity: 1 - swap, transform: `translateX(${swap * -90}px)` }}>{screenA}</AbsoluteFill>
        {swap > 0 && (
          <AbsoluteFill style={{ opacity: swap, transform: `translateX(${(1 - swap) * 90}px)` }}>{screenB}</AbsoluteFill>
        )}
      </Phone>

      {/* The closing statement. The device washes out behind it. */}
      {statementIn > 0 && (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: SAFE_BOX.y + 196,
              bottom: 0,
              background: light.bg,
              opacity: statementIn * 0.95,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: SAFE_BOX.x,
              width: SAFE_BOX.width,
              top: SAFE_BOX.y + 290,
              opacity: statementIn,
              transform: `translateY(${(1 - statementIn) * 44}px)`,
            }}
          >
            {statement}
          </div>
        </AbsoluteFill>
      )}

      {frame >= AT.CTA && <AdventEndCard enter={ctaIn} />}

      {showGuides && <SafeZones />}
    </AbsoluteFill>
  );
};

/** A large closing line with an Advent accent bar. */
export const Statement: React.FC<{ children: React.ReactNode; sub?: string }> = ({ children, sub }) => (
  <div>
    <div style={{ display: 'flex', gap: 8, marginBottom: 34 }}>
      {[ADVENT.hope, ADVENT.peace, ADVENT.joy, ADVENT.love].map((c) => (
        <div key={c} style={{ width: 54, height: 8, borderRadius: 4, background: c }} />
      ))}
    </div>
    <div style={{ font: `700 80px/92px ${SANS}`, letterSpacing: -2.6, color: light.ink }}>{children}</div>
    {sub && (
      <div style={{ font: `500 38px/50px ${SANS}`, letterSpacing: -0.4, color: light.mute, marginTop: 30 }}>{sub}</div>
    )}
  </div>
);

/** Slate end card: what, when, how much, and the download button. */
export const AdventEndCard: React.FC<{ enter: number }> = ({ enter }) => {
  const frame = useCurrentFrame();
  const fade = (from: number, to = 0.78) => interpolate(frame, [AT.CTA + from, AT.CTA + from + 12], [0, to], clamp);
  return (
    <AbsoluteFill style={{ background: light.narr, transform: `translateY(${(1 - enter) * H}px)` }}>
      <SafeArea>
        <BrandLockup morph={1} tone="cream" boxWidth={SAFE_BOX.width} />
        <div style={{ position: 'absolute', top: 96, left: 0 }}>
          <ColourRule width={SAFE_BOX.width} progress={1} colors={RULE_DARK} />
        </div>
        <div style={{ position: 'absolute', top: 168, left: 0, right: 0 }}>
          <div
            style={{
              font: `700 26px/32px ${SANS}`,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#C9B6E4',
              opacity: fade(4, 1),
              marginBottom: 14,
            }}
          >
            Starts Sunday 29 November
          </div>
          <RevealLine text="The Advent Journey." start={AT.CTA + 8} size={88} leading={100} color={light.cream} />
          <RevealLine text="Read it together." start={AT.CTA + 15} size={88} leading={100} color={light.cream} />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 432,
            font: `400 36px/48px ${SANS}`,
            letterSpacing: 0.3,
            color: light.cream,
            opacity: fade(22),
          }}
        >
          Free · 26 stories · one a day to Christmas Eve
        </div>
        <div style={{ position: 'absolute', top: 530, opacity: fade(30, 1) }}>
          <DownloadCTA pulse={(frame - AT.CTA) / 9} />
        </div>
      </SafeArea>
    </AbsoluteFill>
  );
};
