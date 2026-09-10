import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SANS } from '../theme';

/**
 * Word-by-word reveal: each word rises out of a clipping band, so the line
 * assembles itself rather than fading in as a block.
 */
export const RevealLine: React.FC<{
  text: string;
  start: number;
  stagger?: number;
  size: number;
  leading: number;
  color: string;
  weight?: number;
  tracking?: number;
  style?: React.CSSProperties;
}> = ({ text, start, stagger = 1.6, size, leading, color, weight = 700, tracking = -3, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        font: `${weight} ${size}px/${leading}px ${SANS}`,
        letterSpacing: tracking,
        color,
        display: 'flex',
        flexWrap: 'wrap',
        ...style,
      }}
    >
      {text.split(' ').map((word, i) => {
        const p = spring({
          frame: frame - (start + i * stagger),
          fps,
          config: { damping: 200 },
          durationInFrames: 14,
        });
        // The clipping band has to clear the descenders, so it runs a little
        // deeper than the line box and is pulled back up by the same amount.
        const slack = Math.round(size * 0.26);
        return (
          <span
            key={i}
            style={{
              overflow: 'hidden',
              display: 'inline-block',
              height: leading + slack,
              marginBottom: -slack,
              marginRight: '0.28em',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${(1 - p) * (leading + slack)}px)`,
              }}
            >
              {word}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** The four source colours as a rule — the brand's most recognisable mark. */
export const ColourRule: React.FC<{ width: number; progress: number; colors: string[] }> = ({
  width,
  progress,
  colors,
}) => (
  <div style={{ display: 'flex', gap: 5, height: 8, width }}>
    {colors.map((c, i) => (
      <div
        key={c}
        style={{
          flex: 1,
          background: c,
          borderRadius: 4,
          transform: `scaleX(${interpolate(progress, [i * 0.12, i * 0.12 + 0.5], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })})`,
          transformOrigin: 'left',
        }}
      />
    ))}
  </div>
);
