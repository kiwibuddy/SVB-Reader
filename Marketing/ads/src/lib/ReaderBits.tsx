import React from 'react';
import type { Line } from '../data/script-gen3';
import { FILL, INK, IS_LEFT, light, SANS } from '../theme';
import { SCREEN_W } from './Phone';

/* In-device type. Larger than the shipping app draws it, because real 16pt
   body text is unreadable at feed size. Layout and colour stay exact. */
export const BODY = 34;
export const LEADING = 46;
export const BUBBLE_MAX = Math.round(SCREEN_W * 0.79);
const CHARS_PER_LINE = 34;

/** Chapter and verse marks in the text: ⟪6⟫ chapter, ⟦29⟧ verse (scripts/advent-data.mjs). */
const MARK = /(⟪[^⟫]*⟫|⟦[^⟧]*⟧)/;
const visibleText = (text: string) => text.replace(/⟪[^⟫]*⟫|⟦[^⟧]*⟧/g, '');

export const heightOf = (line: Line, size: number = BODY) => {
  const leading = Math.round((size * LEADING) / BODY);
  const perLine = (CHARS_PER_LINE * BODY) / size;
  const rows = Math.max(1, Math.ceil(visibleText(line.text).length / perLine));
  return (line.cont ? 0 : 26 + 10) + rows * leading + 44 + 22;
};

/** Text with the app's verse numbers: small raised numerals, chapter numbers inline. */
const Marked: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <>
    {text.split(MARK).map((part, i) => {
      if (part.startsWith('⟪')) {
        return (
          <span key={i} style={{ fontWeight: 600 }}>
            {part.slice(1, -1)}
          </span>
        );
      }
      if (part.startsWith('⟦')) {
        return (
          <span key={i} style={{ fontSize: '0.58em', verticalAlign: '0.62em', lineHeight: 0, color, opacity: 0.85 }}>
            {part.slice(1, -1)}{' '}
          </span>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    })}
  </>
);

export const Bubble: React.FC<{
  line: Line;
  progress: number;
  dim?: boolean;
  glow?: boolean;
  /** Type size; the 2.0 ads use BODY. */
  size?: number;
  /** As the app draws it: no outline on narration, a thick outline on your part. */
  app?: boolean;
  /** This turn belongs to the part picked on this phone. */
  mine?: boolean;
}> = ({ line, progress, dim, glow, size = BODY, app = false, mine = false }) => {
  const left = IS_LEFT[line.color];
  const ink = INK[line.color];
  const narration = line.color === 'black';
  const leading = Math.round((size * LEADING) / BODY);
  const border = app
    ? narration
      ? `${glow ? 2.5 : 0}px solid ${glow ? `${light.narr}55` : 'transparent'}`
      : `${mine || glow ? 3.5 : 1.8}px solid ${ink}`
    : `${glow ? 3 : 1.8}px solid ${narration ? light.hair : ink}`;
  const indent = app && narration && /^⟪|^⟦/.test(line.text);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: left ? 'flex-start' : 'flex-end',
        marginBottom: 22,
        opacity: progress * (dim ? 0.34 : 1),
        transform: `translateY(${(1 - progress) * 26}px)`,
      }}
    >
      {!line.cont && (
      <div
        style={{
          font: `700 20px/26px ${SANS}`,
          letterSpacing: 2.6,
          textTransform: 'uppercase',
          color: ink,
          marginBottom: 10,
          padding: '0 4px',
        }}
      >
        {line.speaker}
      </div>
      )}
      <div
        style={{
          maxWidth: narration ? '100%' : BUBBLE_MAX,
          background: FILL[line.color],
          border,
          borderRadius: 26,
          borderTopLeftRadius: left ? 8 : 26,
          borderTopRightRadius: left ? 26 : 8,
          padding: '22px 26px',
          boxShadow: glow ? `0 0 0 8px ${ink}1E, 0 12px 30px ${ink}2A` : `0 6px 20px ${ink}12`,
        }}
      >
        <div
          style={{
            font: `400 ${size}px/${leading}px ${SANS}`,
            color: narration ? light.ink : ink,
            textIndent: indent ? '1.3em' : undefined,
          }}
        >
          <Marked text={line.text} color={narration ? light.mute : ink} />
        </div>
      </div>
    </div>
  );
};

/** Story header as it appears at the top of a reading screen. */
export const StoryHeader: React.FC<{
  title: string;
  meta: string;
  mix: Array<[string, number]>;
}> = ({ title, meta, mix }) => (
  <div style={{ position: 'absolute', left: 34, right: 34, top: 112 }}>
    <div style={{ font: `700 40px/48px ${SANS}`, letterSpacing: -0.8, color: light.ink }}>{title}</div>
    <div
      style={{
        font: `500 19px/24px ${SANS}`,
        letterSpacing: 1.8,
        textTransform: 'uppercase',
        color: light.mute,
        marginTop: 6,
      }}
    >
      {meta}
    </div>
    <div style={{ display: 'flex', gap: 5, height: 8, marginTop: 16 }}>
      {mix.map(([c, w], i) => (
        <div key={i} style={{ flexGrow: w, flexBasis: 0, background: c, borderRadius: 4 }} />
      ))}
    </div>
  </div>
);
