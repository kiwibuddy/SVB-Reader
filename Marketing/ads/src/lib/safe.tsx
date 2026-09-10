import React from 'react';
import { AbsoluteFill } from 'remotion';
import { FEED_CROP, H, SAFE, SAFE_BOX, W } from '../theme';

/**
 * Everything legible must live inside this box. Outside it, Meta draws the
 * username, caption, CTA button and action rail over the top of the video.
 */
export const SafeArea: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <AbsoluteFill
    style={{
      left: SAFE_BOX.x,
      top: SAFE_BOX.y,
      width: SAFE_BOX.width,
      height: SAFE_BOX.height,
      ...style,
    }}
  >
    {children}
  </AbsoluteFill>
);

/**
 * Preview-only overlay. Render a still with `showGuides` on to check a
 * composition, then turn it off. Never leave it on in a delivered file.
 */
export const SafeZones: React.FC = () => {
  const band: React.CSSProperties = {
    position: 'absolute',
    background: 'rgba(192,38,26,0.16)',
    outline: '2px dashed rgba(192,38,26,0.55)',
  };
  const label: React.CSSProperties = {
    position: 'absolute',
    font: '600 22px/1 -apple-system, sans-serif',
    color: 'rgba(192,38,26,0.9)',
    letterSpacing: 1,
  };
  return (
    <AbsoluteFill>
      <div style={{ ...band, left: 0, top: 0, width: W, height: SAFE.top }} />
      <div style={{ ...band, left: 0, bottom: 0, width: W, height: SAFE.bottom }} />
      <div style={{ ...band, left: 0, top: 0, width: SAFE.side, height: H }} />
      <div style={{ ...band, right: 0, top: 0, width: SAFE.side, height: H }} />
      <div
        style={{
          ...band,
          right: 0,
          bottom: 0,
          width: W * 0.34,
          height: SAFE.bottomRight,
          background: 'rgba(192,38,26,0.1)',
        }}
      />
      {/* Where the Facebook feed's 4:5 crop cuts a 9:16 asset. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: FEED_CROP.top,
          bottom: FEED_CROP.bottom,
          outline: '2px solid rgba(29,70,168,0.7)',
        }}
      />
      <div style={{ ...label, left: SAFE.side + 12, top: SAFE.top + 10 }}>
        SAFE TOP {SAFE.top}px
      </div>
      <div style={{ ...label, left: SAFE.side + 12, bottom: SAFE.bottom + 10 }}>
        SAFE BOTTOM {SAFE.bottom}px
      </div>
      <div style={{ ...label, left: SAFE.side + 12, top: FEED_CROP.top + 10, color: 'rgba(29,70,168,0.9)' }}>
        FEED 4:5 CROP
      </div>
    </AbsoluteFill>
  );
};
