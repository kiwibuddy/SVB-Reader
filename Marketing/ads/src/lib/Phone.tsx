import React from 'react';
import { light } from '../theme';

export const PHONE_W = 748;
export const PHONE_H = 1560;
const BEZEL = 15;

export const SCREEN_W = PHONE_W - BEZEL * 2;
export const SCREEN_H = PHONE_H - BEZEL * 2;

/**
 * Device shell. Positioned by the caller so it can fly in, drift and leave —
 * the screen is a plain box, so anything can be rendered inside it.
 */
export const Phone: React.FC<{
  x: number;
  y: number;
  scale?: number;
  tilt?: number;
  children: React.ReactNode;
}> = ({ x, y, scale = 1, tilt = 0, children }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: PHONE_W,
      height: PHONE_H,
      transform: `scale(${scale}) rotate(${tilt}deg)`,
      transformOrigin: '50% 30%',
      borderRadius: 78,
      background: '#0B1013',
      padding: BEZEL,
      boxShadow: `0 60px 120px rgba(16,22,25,0.28), 0 12px 36px rgba(16,22,25,0.16)`,
    }}
  >
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: 64,
        overflow: 'hidden',
        background: light.bg,
      }}
    >
      {children}
      {/* Dynamic island */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 22,
          width: 172,
          height: 50,
          marginLeft: -86,
          borderRadius: 25,
          background: '#0B1013',
        }}
      />
    </div>
  </div>
);

/** iOS status bar, drawn to match the real thing closely enough to read. */
export const StatusBar: React.FC<{ time?: string }> = ({ time = '7:28' }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 94,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 52px 0 60px',
      font: '600 27px/1 -apple-system, sans-serif',
      color: light.ink,
    }}
  >
    <span style={{ letterSpacing: 0.4 }}>{time}</span>
    <span style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
      {[7, 11, 15, 19].map((h, i) => (
        <span
          key={i}
          style={{ width: 6, height: h, borderRadius: 2, background: light.ink, opacity: i > 2 ? 0.3 : 1 }}
        />
      ))}
      <span
        style={{
          marginLeft: 10,
          width: 46,
          height: 23,
          borderRadius: 7,
          border: `2.4px solid ${light.ink}`,
          opacity: 0.85,
        }}
      />
    </span>
  </div>
);
