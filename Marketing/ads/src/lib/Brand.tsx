import React from 'react';
import { Img, staticFile } from 'remotion';
import { light, SANS } from '../theme';

/**
 * The opening title, and the header it becomes. `morph` runs 0 (title card,
 * logo large and centred) to 1 (header row, top left). The logo is the element
 * that actually travels; the two text settings cross over behind it, which the
 * eye reads as one continuous move.
 *
 * Every ad in the set opens with this, so the family is recognisable from the
 * first frame regardless of which creative someone sees first.
 */
export const BrandLockup: React.FC<{
  morph: number;
  tone?: 'ink' | 'cream';
  boxWidth: number;
}> = ({ morph, tone = 'ink', boxWidth }) => {
  const color = tone === 'cream' ? light.cream : light.ink;
  const m = clamp01(morph);

  const size = lerp(248, 66, m);
  const logoX = lerp((boxWidth - 248) / 2, 0, m);
  const logoY = lerp(232, 0, m);

  return (
    <>
      <Img
        src={staticFile('icon.png')}
        style={{
          position: 'absolute',
          left: logoX,
          top: logoY,
          width: size,
          height: size,
          borderRadius: size * 0.226,
          display: 'block',
        }}
      />

      {/* Title-card setting */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: lerp(520, 470, m),
          width: boxWidth,
          textAlign: 'center',
          opacity: 1 - clamp01(m * 1.9),
        }}
      >
        <div style={{ font: `700 84px/94px ${SANS}`, letterSpacing: -2.6, color }}>
          SourceView Together
        </div>
        <div
          style={{
            font: `500 40px/50px ${SANS}`,
            letterSpacing: 5,
            textTransform: 'uppercase',
            color,
            opacity: 0.6,
            marginTop: 14,
          }}
        >
          Bible App
        </div>
      </div>

      {/* Header setting */}
      <div
        style={{
          position: 'absolute',
          left: 86,
          top: 0,
          opacity: clamp01((m - 0.55) / 0.45),
        }}
      >
        <div style={{ font: `700 31px/34px ${SANS}`, letterSpacing: -0.5, color }}>
          SourceView Together
        </div>
        <div
          style={{
            font: `500 21px/26px ${SANS}`,
            letterSpacing: 0.6,
            color,
            opacity: 0.62,
            marginTop: 2,
          }}
        >
          Bible App · iOS &amp; Android
        </div>
      </div>
    </>
  );
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const AppleGlyph: React.FC<{ color: string }> = ({ color }) => (
  <svg width="30" height="36" viewBox="0 0 24 28" fill={color}>
    <path d="M17.6 14.8c0-3 2.4-4.4 2.5-4.5-1.4-2-3.5-2.3-4.2-2.3-1.8-.2-3.5 1-4.4 1-.9 0-2.3-1-3.8-1C5.8 8 4 9.1 3 11c-2 3.5-.5 8.7 1.4 11.5.9 1.4 2 2.9 3.5 2.9 1.4-.1 1.9-.9 3.6-.9s2.2.9 3.7.9c1.5 0 2.5-1.4 3.4-2.8 1.1-1.6 1.5-3.1 1.5-3.2-.1 0-2.9-1.1-2.9-4.4zM14.8 5.9c.8-1 1.3-2.3 1.1-3.6-1.1 0-2.5.8-3.3 1.7-.7.8-1.3 2.2-1.2 3.4 1.3.1 2.6-.6 3.4-1.5z" />
  </svg>
);

const PlayGlyph: React.FC<{ color: string }> = ({ color }) => (
  <svg width="30" height="34" viewBox="0 0 24 26" fill={color}>
    <path d="M3 1.6v22.8c0 .7.8 1.1 1.3.6l11.9-11.4c.4-.4.4-1 0-1.3L4.3 1c-.5-.5-1.3-.1-1.3.6z" />
  </svg>
);

/**
 * Download call to action. Placeholder store chips — swap in the official
 * Apple and Google badge artwork before this runs as a paid ad.
 */
export const StoreCTA: React.FC<{ tone?: 'ink' | 'cream' }> = ({ tone = 'cream' }) => {
  const color = tone === 'cream' ? light.cream : light.ink;
  const chip: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    border: `2.5px solid ${color}`,
    borderRadius: 18,
    padding: '16px 26px',
  };
  const small: React.CSSProperties = {
    font: `500 18px/20px ${SANS}`,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color,
    opacity: 0.7,
  };
  const big: React.CSSProperties = {
    font: `700 28px/32px ${SANS}`,
    letterSpacing: -0.2,
    color,
  };
  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={chip}>
        <AppleGlyph color={color} />
        <div>
          <div style={small}>Download on the</div>
          <div style={big}>App Store</div>
        </div>
      </div>
      <div style={chip}>
        <PlayGlyph color={color} />
        <div>
          <div style={small}>Get it on</div>
          <div style={big}>Google Play</div>
        </div>
      </div>
    </div>
  );
};

/** The primary action: one filled button, with the stores as supporting detail. */
export const DownloadCTA: React.FC<{ pulse?: number }> = ({ pulse = 0 }) => (
  <div>
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 18,
        background: light.cream,
        borderRadius: 999,
        padding: '26px 52px',
        transform: `scale(${1 + Math.sin(pulse) * 0.014})`,
        boxShadow: '0 14px 40px rgba(0,0,0,0.22)',
      }}
    >
      <span style={{ font: `700 44px/48px ${SANS}`, letterSpacing: -0.8, color: '#1B242C' }}>
        Download now
      </span>
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#1B242C" strokeWidth="2.8">
        <path d="M12 3v14M6 12l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <div style={{ marginTop: 26 }}>
      <StoreCTA />
    </div>
  </div>
);
