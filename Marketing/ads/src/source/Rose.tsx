/**
 * All 365 stories as a rose window: one spoke per story, clockwise from
 * Genesis at 12 o'clock, each spoke split by who speaks in it (narration
 * innermost, God at the rim). Drawn from MIX, the app's own word counts.
 */
import React from 'react';
import { MIX } from './data';
import { ON_NIGHT } from './kit';

const BANDS = [ON_NIGHT.black, ON_NIGHT.blue, ON_NIGHT.green, ON_NIGHT.red];

const polar = (cx: number, cy: number, r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

function wedge(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const [x0, y0] = polar(cx, cy, r0, a0);
  const [x1, y1] = polar(cx, cy, r1, a0);
  const [x2, y2] = polar(cx, cy, r1, a1);
  const [x3, y3] = polar(cx, cy, r0, a1);
  return `M${x0.toFixed(1)},${y0.toFixed(1)}L${x1.toFixed(1)},${y1.toFixed(1)}A${r1},${r1} 0 0 1 ${x2.toFixed(1)},${y2.toFixed(1)}L${x3.toFixed(1)},${y3.toFixed(1)}A${r0},${r0} 0 0 0 ${x0.toFixed(1)},${y0.toFixed(1)}Z`;
}

/**
 * `grow(i)` is how far spoke i has grown, 0..1. `focus` (a story index) is drawn
 * white-edged; `dim` fades every other spoke.
 */
export const Rose: React.FC<{
  size: number;
  inner: number;
  grow: (i: number) => number;
  rotate?: number;
  focus?: number;
  dim?: number;
}> = ({ size, inner, grow, rotate = 0, focus, dim = 0 }) => {
  const c = size / 2;
  const outer = size / 2 - 4;
  const step = (2 * Math.PI) / 365;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: `rotate(${rotate}deg)` }}>
      {MIX.map((s, i) => {
        const g = grow(i);
        if (g <= 0) return null;
        const a0 = -Math.PI / 2 + i * step;
        const a1 = a0 + step * 0.8;
        const reach = inner + (outer - inner) * g;
        let r = inner;
        const op = focus === undefined || focus === i ? 1 : 1 - dim;
        return (
          <g key={s.id} opacity={op}>
            {s.mix.map((share, k) => {
              const r1 = r + (reach - inner) * share;
              const d = r1 - r > 0.2 ? wedge(c, c, r, r1, a0, a1) : null;
              r = r1;
              return d ? <path key={k} d={d} fill={BANDS[k]} /> : null;
            })}
            {focus === i ? <path d={wedge(c, c, inner - 6, reach + 10, a0 - step, a1 + step)} fill="none" stroke="#FFFFFF" strokeWidth={3} /> : null}
          </g>
        );
      })}
    </svg>
  );
};
