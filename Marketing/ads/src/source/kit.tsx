/**
 * Shared pieces of the "Back to the source" films: fonts, grain, the kinetic
 * line and the end card. See docs/superpowers/specs/2026-11-24-back-to-the-source-design.md.
 */
import React from 'react';
import { continueRender, delayRender, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { dark, dark as dark_, light } from '../theme';

/* Fonts ship with the ads (OFL), so a render never falls back to Georgia. */
export const DISPLAY = '"Instrument Serif", Georgia, serif';
export const TEXT = 'Inter, -apple-system, "Helvetica Neue", Arial, sans-serif';

if (typeof document !== 'undefined' && !document.getElementById('source-fonts')) {
  const css = document.createElement('style');
  css.id = 'source-fonts';
  css.textContent = `
    @font-face { font-family: 'Instrument Serif'; font-style: normal; font-weight: 400; src: url(${staticFile('fonts/InstrumentSerif-400.woff2')}) format('woff2'); }
    @font-face { font-family: 'Instrument Serif'; font-style: italic; font-weight: 400; src: url(${staticFile('fonts/InstrumentSerif-400i.woff2')}) format('woff2'); }
    @font-face { font-family: 'Inter'; font-style: normal; font-weight: 100 900; src: url(${staticFile('fonts/Inter.woff2')}) format('woff2'); }`;
  document.head.appendChild(css);
  const handle = delayRender('Loading Instrument Serif and Inter', { timeoutInMilliseconds: 120000, retries: 2 });
  Promise.all([
    document.fonts.load('400 100px "Instrument Serif"'),
    document.fonts.load('italic 400 100px "Instrument Serif"'),
    document.fonts.load('600 100px Inter'),
  ]).then(
    () => continueRender(handle),
    (err) => {
      console.error('Font load failed', err);
      continueRender(handle);
    },
  );
}

export const NIGHT = '#0B0F12';
export const PAPER = '#F2EAE0';
export const INK_PAPER = '#17140F';
export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Voice colours: the light set for paper, the app's dark-mode set for night. */
export const ON_PAPER = { black: light.narr, red: light.divine, green: light.prin, blue: light.chor } as const;
export const ON_NIGHT = { black: dark.narr, red: dark.divine, green: dark.prin, blue: dark.chor } as const;

/** Fine film grain, re-seeded every other frame. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.14 }) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 50;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: 'absolute', inset: 0, opacity, mixBlendMode: 'overlay', pointerEvents: 'none' }}
    >
      <filter id={`grain-${seed}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
    </svg>
  );
};

/**
 * A line of type revealed word by word from `start`, each word rising a little.
 * `perWord` frames between words; 0 shows the whole line at once.
 */
export const Words: React.FC<{
  text: string;
  start: number;
  perWord?: number;
  style?: React.CSSProperties;
}> = ({ text, start, perWord = 2, style }) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');
  return (
    <div style={style}>
      {words.map((w, i) => {
        const t = interpolate(frame, [start + i * perWord, start + i * perWord + 6], [0, 1], {
          ...clamp,
          easing: Easing.out(Easing.cubic),
        });
        return (
          <span key={i} style={{ display: 'inline-block', opacity: t, transform: `translateY(${(1 - t) * 14}px)` }}>
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </div>
  );
};

/** Speaker and reference in small caps above a quoted line. */
export const Label: React.FC<{ speaker: string; reference: string; color: string; start: number }> = ({
  speaker,
  reference,
  color,
  start,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [start, start + 8], [0, 1], clamp);
  return (
    <div style={{ font: `600 30px/38px ${TEXT}`, letterSpacing: '0.14em', textTransform: 'uppercase', color, opacity: o }}>
      {speaker} · {reference}
    </div>
  );
};

/**
 * The shared end card: icon, a line, the name, four bars, the stores.
 * `line` defaults to the campaign line; `sub` is a small line under it; `dark` for night films.
 */
export const EndCard: React.FC<{ at: number; line?: string; sub?: string; dark?: boolean; bg?: string }> = ({
  at,
  line = 'Back to the source.',
  sub,
  dark = false,
  bg,
}) => {
  const frame = useCurrentFrame();
  const t = (d: number) => interpolate(frame, [at + d, at + d + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const rise = (d: number): React.CSSProperties => ({ opacity: t(d), transform: `translateY(${(1 - t(d)) * 24}px)` });
  const bars = dark ? [dark_.narr, dark_.divine, dark_.prin, dark_.chor] : [light.narr, light.divine, light.prin, light.chor];
  const ink = dark ? '#F5ECDD' : light.ink;
  return (
    <div style={{ position: 'absolute', inset: 0, background: bg ?? (dark ? '#120C08' : light.bg) }}>
      <div style={{ position: 'absolute', left: 96, right: 96, top: 380, display: 'grid', gap: 40 }}>
        <Img src={staticFile('icon.png')} style={{ width: 168, height: 168, borderRadius: 38, ...rise(0) }} />
        <div style={{ display: 'grid', gap: 18, ...rise(6) }}>
          <div style={{ font: `400 ${line.length > 22 ? 120 : 150}px/0.98 ${DISPLAY}`, color: ink, letterSpacing: -1 }}>{line}</div>
          {sub ? <div style={{ font: `500 40px/1.25 ${TEXT}`, color: ink, opacity: 0.72 }}>{sub}</div> : null}
        </div>
        <div style={{ display: 'grid', gap: 22, ...rise(14) }}>
          <div style={{ font: `650 50px/58px ${TEXT}`, color: ink, letterSpacing: -0.5 }}>SourceView Together</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, width: 520 }}>
            {bars.map((c) => (
              <div key={c} style={{ height: 10, borderRadius: 5, background: c }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, ...rise(22) }}>
          {['App Store', 'Google Play'].map((s) => (
            <div key={s} style={{ font: `600 34px/1 ${TEXT}`, color: dark ? '#120C08' : '#FFFFFF', background: ink, padding: '24px 34px', borderRadius: 20 }}>
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
