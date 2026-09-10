import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { dark, H, light, SAFE_BOX, SANS, W } from '../theme';
import { BrandLockup, DownloadCTA } from './Brand';
import { Phone, PHONE_W } from './Phone';
import { SafeArea, SafeZones } from './safe';
import { ColourRule, RevealLine } from './Type';
import { T } from './timeline';

const RULE = [light.narr, light.divine, light.prin, light.chor];
const RULE_DARK = [dark.narr, dark.divine, dark.prin, dark.chor];

const PHONE_X = (W - PHONE_W) / 2;
const PHONE_REST_Y = 486;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Title card, morph, hook, device flight and end card — everything the four
 * ads share. Each ad supplies only its hook, its kicker, what plays on the
 * device, and an optional line that rises over the device at the end.
 */
export const AdShell: React.FC<{
  hook1: string;
  hook2: string;
  kicker: string;
  screen: React.ReactNode;
  overlay?: React.ReactNode;
  overlayAt?: number;
  showGuides?: boolean;
}> = ({ hook1, hook2, kicker, screen, overlay, overlayAt = T.PHONE_OUT - 46, showGuides }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const morph = interpolate(frame, [T.TITLE_HOLD, T.MORPH_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });

  const rise = spring({
    frame: frame - T.PHONE_IN,
    fps,
    config: { damping: 26, mass: 1.1 },
    durationInFrames: 44,
  });
  const leave = spring({
    frame: frame - T.PHONE_OUT,
    fps,
    config: { damping: 200 },
    durationInFrames: 22,
  });
  const drift = interpolate(frame, [T.PHONE_IN, T.PHONE_OUT], [0, -34], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const phoneY = interpolate(rise, [0, 1], [H + 60, PHONE_REST_Y]) + drift + leave * (H + 200);
  const tilt = interpolate(rise, [0, 1], [4.5, 0]) + leave * 5;

  const hookOut = interpolate(frame, [T.PHONE_IN - 14, T.PHONE_IN + 2], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ctaIn = spring({ frame: frame - T.CTA, fps, config: { damping: 200 }, durationInFrames: 20 });
  const overlayIn = interpolate(frame, [overlayAt, overlayAt + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: light.bg }}>
      <SafeArea>
        <BrandLockup morph={morph} boxWidth={SAFE_BOX.width} />

        <div style={{ position: 'absolute', top: 88, left: 0, opacity: morph }}>
          <ColourRule
            width={SAFE_BOX.width}
            progress={interpolate(frame, [T.MORPH_END - 6, T.MORPH_END + 14], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}
            colors={RULE}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            top: 748,
            left: (SAFE_BOX.width - 420) / 2,
            opacity: 1 - clamp01(morph * 2),
          }}
        >
          <ColourRule
            width={420}
            progress={interpolate(frame, [16, 40], [0, 1], { extrapolateRight: 'clamp' })}
            colors={RULE}
          />
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
          <RevealLine text={hook1} start={T.HOOK_1} size={92} leading={106} color={light.ink} />
          <div style={{ height: 26 }} />
          <RevealLine text={hook2} start={T.HOOK_2} size={92} leading={106} color={light.divine} />
        </div>

        <div
          style={{
            position: 'absolute',
            top: 116,
            left: 0,
            opacity:
              interpolate(frame, [T.PHONE_IN + 4, T.PHONE_IN + 18], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }) *
              (1 - leave) *
              (1 - overlayIn),
            font: `600 42px/52px ${SANS}`,
            letterSpacing: -0.8,
            color: light.ink,
          }}
        >
          {kicker}
        </div>
      </SafeArea>

      <Phone x={PHONE_X} y={phoneY} tilt={tilt}>
        {screen}
      </Phone>

      {/* The closing statement. The device washes out behind it rather than
          being covered by a floating panel, so the line owns the frame. */}
      {overlay && overlayIn > 0 && (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: SAFE_BOX.y + 196,
              bottom: 0,
              background: light.bg,
              opacity: overlayIn * 0.94,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: SAFE_BOX.x,
              width: SAFE_BOX.width,
              top: SAFE_BOX.y + 300,
              opacity: overlayIn,
              transform: `translateY(${(1 - overlayIn) * 44}px)`,
            }}
          >
            {overlay}
          </div>
        </AbsoluteFill>
      )}

      {frame >= T.CTA && (
        <AbsoluteFill style={{ background: light.narr, transform: `translateY(${(1 - ctaIn) * H}px)` }}>
          <SafeArea>
            <BrandLockup morph={1} tone="cream" boxWidth={SAFE_BOX.width} />
            <div style={{ position: 'absolute', top: 96, left: 0 }}>
              <ColourRule width={SAFE_BOX.width} progress={1} colors={RULE_DARK} />
            </div>
            <div style={{ position: 'absolute', top: 176, left: 0, right: 0 }}>
              <RevealLine
                text="Scripture redesigned"
                start={T.CTA + 8}
                size={88}
                leading={100}
                color={light.cream}
              />
              <RevealLine
                text="for a social generation."
                start={T.CTA + 14}
                size={88}
                leading={100}
                color={light.cream}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                top: 400,
                font: `400 38px/50px ${SANS}`,
                letterSpacing: 0.4,
                color: light.cream,
                opacity: interpolate(frame, [T.CTA + 22, T.CTA + 34], [0, 0.78], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              }}
            >
              Over 700 voices · 365 stories
            </div>
            <div
              style={{
                position: 'absolute',
                top: 500,
                opacity: interpolate(frame, [T.CTA + 30, T.CTA + 44], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              }}
            >
              <DownloadCTA pulse={(frame - T.CTA) / 9} />
            </div>
          </SafeArea>
        </AbsoluteFill>
      )}

      {showGuides && <SafeZones />}
    </AbsoluteFill>
  );
};

/** The closing statement. Set large, because it is the last thing read. */
export const OverlayStat: React.FC<{ children: React.ReactNode; accent?: string }> = ({
  children,
  accent = light.divine,
}) => (
  <div>
    <div style={{ width: 128, height: 8, borderRadius: 4, background: accent, marginBottom: 34 }} />
    <div
      style={{
        font: `700 82px/94px ${SANS}`,
        letterSpacing: -2.6,
        color: light.ink,
      }}
    >
      {children}
    </div>
  </div>
);
