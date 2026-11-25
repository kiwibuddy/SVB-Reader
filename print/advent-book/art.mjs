// Drawn artwork for the Advent book: the four Advent candles, the night sky
// with its one bright star, and an evergreen garland. Pure SVG, no images, so
// it prints sharp at any size.

import { WEEKS } from './content.mjs';

// Deterministic random numbers, so every build draws the same sky.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// A four-pointed star with long thin rays, the shape of light on a cold night.
export function star(cx, cy, r, fill = '#F2D58A') {
  const k = r * 0.16;
  const d = `M ${cx} ${cy - r} C ${cx + k} ${cy - k} ${cx + k} ${cy - k} ${cx + r} ${cy}
    C ${cx + k} ${cy + k} ${cx + k} ${cy + k} ${cx} ${cy + r}
    C ${cx - k} ${cy + k} ${cx - k} ${cy + k} ${cx - r} ${cy}
    C ${cx - k} ${cy - k} ${cx - k} ${cy - k} ${cx} ${cy - r} Z`;
  const r2 = r * 0.55;
  const k2 = r2 * 0.18;
  const d2 = `M ${cx - r2} ${cy - r2} Q ${cx - k2} ${cy - k2} ${cx} ${cy} Q ${cx - k2} ${cy - k2} ${cx - r2} ${cy - r2} Z`;
  void d2;
  const diag = [45, 135, 225, 315]
    .map((a) => {
      const t = (a * Math.PI) / 180;
      return `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(t) * r * 0.5).toFixed(2)}" y2="${(cy + Math.sin(t) * r * 0.5).toFixed(2)}"/>`;
    })
    .join('');
  return `
    <g>
      <circle cx="${cx}" cy="${cy}" r="${r * 1.6}" fill="url(#starGlow)"/>
      <g stroke="${fill}" stroke-width="${(r * 0.035).toFixed(2)}" stroke-linecap="round" opacity="0.7">${diag}</g>
      <path d="${d}" fill="${fill}"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 0.12}" fill="#FFF8E6"/>
    </g>`;
}

export function sky(w, h, { seed = 7, count = 150, top = 0, bottom = h, avoid = [] } = {}) {
  const rand = rng(seed);
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    // More stars near the top of the sky, fewer towards the candles.
    const y = top + Math.pow(rand(), 1.6) * (bottom - top);
    if (avoid.some(([ax, ay, aw, ah]) => x > ax && x < ax + aw && y > ay && y < ay + ah)) continue;
    const big = rand() > 0.93;
    const r = big ? 0.55 + rand() * 0.35 : 0.18 + rand() * 0.3;
    const op = (0.25 + rand() * 0.6).toFixed(2);
    out += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}" fill="#F2EAE0" opacity="${op}"/>`;
    if (big && rand() > 0.5) {
      out += `<path d="M ${x.toFixed(2)} ${(y - r * 3).toFixed(2)} L ${x.toFixed(2)} ${(y + r * 3).toFixed(2)} M ${(x - r * 3).toFixed(2)} ${y.toFixed(2)} L ${(x + r * 3).toFixed(2)} ${y.toFixed(2)}" stroke="#F2EAE0" stroke-width="0.18" opacity="${op}"/>`;
    }
  }
  return out;
}

function flame(cx, top, s, lit) {
  if (!lit) {
    // An unlit wick and a thread of smoke.
    return `<path d="M ${cx} ${top} l 0 ${-1.6 * s}" stroke="#2A2A2A" stroke-width="${0.35 * s}" stroke-linecap="round"/>`;
  }
  const h = 7.5 * s;
  const w = 2.3 * s;
  return `
    <ellipse cx="${cx}" cy="${top - h * 0.45}" rx="${w * 3.2}" ry="${h * 1.25}" fill="url(#flameGlow)"/>
    <path d="M ${cx} ${top - h} C ${cx + w * 0.4} ${top - h * 0.62} ${cx + w} ${top - h * 0.32} ${cx + w * 0.62} ${top - h * 0.06}
             C ${cx + w * 0.3} ${top + 0.4 * s} ${cx - w * 0.3} ${top + 0.4 * s} ${cx - w * 0.62} ${top - h * 0.06}
             C ${cx - w} ${top - h * 0.32} ${cx - w * 0.4} ${top - h * 0.62} ${cx} ${top - h} Z" fill="#F7C35F"/>
    <path d="M ${cx} ${top - h * 0.62} C ${cx + w * 0.42} ${top - h * 0.34} ${cx + w * 0.36} ${top - h * 0.05} ${cx} ${top - h * 0.02}
             C ${cx - w * 0.36} ${top - h * 0.05} ${cx - w * 0.42} ${top - h * 0.34} ${cx} ${top - h * 0.62} Z" fill="#FFF3D1"/>
    <path d="M ${cx} ${top} l 0 ${-1.2 * s}" stroke="#3A2A1A" stroke-width="${0.3 * s}" stroke-linecap="round"/>`;
}

// One candle: ivory wax with a band in its week's colour, so the four stay
// distinct on any cover colour.
function candle(cx, base, height, s, week, lit, { label = true, labelColor = '#F2EAE0' } = {}) {
  const w = 9 * s;
  const top = base - height;
  const drip = `M ${cx - w / 2} ${top + 1.2 * s} q ${w * 0.12} ${3.4 * s} ${w * 0.22} 0 q ${w * 0.1} ${1.8 * s} ${w * 0.2} 0`;
  return `
    <g>
      <rect x="${cx - w / 2}" y="${top}" width="${w}" height="${height}" rx="${1.1 * s}" fill="url(#wax)"/>
      <ellipse cx="${cx}" cy="${top + 0.5 * s}" rx="${w / 2}" ry="${1.1 * s}" fill="#FFFBF2"/>
      <path d="${drip}" fill="#FFFBF2"/>
      <rect x="${cx - w / 2}" y="${base - height * 0.34}" width="${w}" height="${2.6 * s}" fill="${week.color}"/>
      <rect x="${cx - w / 2}" y="${base - height * 0.34 + 3.3 * s}" width="${w}" height="${0.7 * s}" fill="${week.color}" opacity="0.75"/>
      ${flame(cx, top, s, lit)}
      ${label ? `<text x="${cx}" y="${base + 9.6 * s}" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="${2.5 * s}" letter-spacing="${0.5 * s}" fill="${labelColor}">${week.name.toUpperCase()}</text>` : ''}
    </g>`;
}

// Evergreen garland along the foot of the candles: overlapping needles and a
// few gold berries.
function garland(x0, x1, y, s, seed = 3, { dark = '#1F4A35', light = '#2F6A4A' } = {}) {
  const rand = rng(seed);
  const mid = '#28593F';
  let back = '';
  let front = '';
  const n = Math.round((x1 - x0) / (0.55 * s));
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const x = x0 + t * (x1 - x0);
    // A bough that is fullest in the middle and tapers at both ends.
    const fullness = Math.sin(Math.PI * t);
    for (let j = 0; j < 4; j++) {
      const up = rand() > 0.28;
      const a = (up ? -170 + rand() * 160 : 15 + rand() * 150) * (Math.PI / 180);
      const len = (1.6 + rand() * 3.2) * s * (0.55 + 0.6 * fullness);
      const yy = y + (rand() - 0.5) * 2.6 * s * (0.4 + fullness);
      const col = [dark, mid, light][Math.floor(rand() * 3)];
      const stroke = `<path d="M ${x.toFixed(2)} ${yy.toFixed(2)} l ${(Math.cos(a) * len).toFixed(2)} ${(Math.sin(a) * len).toFixed(2)}" stroke="${col}" stroke-width="${(0.42 * s).toFixed(2)}" stroke-linecap="round"/>`;
      if (up) back += stroke; else front += stroke;
    }
  }
  let berries = '';
  for (let i = 0; i < 14; i++) {
    const x = x0 + 5 * s + rand() * (x1 - x0 - 10 * s);
    const yy = y + (rand() - 0.3) * 2.4 * s;
    const red = rand() > 0.45;
    berries += `<circle cx="${x.toFixed(2)}" cy="${yy.toFixed(2)}" r="${((red ? 0.75 : 0.95) * s).toFixed(2)}" fill="${red ? '#B3261E' : '#D9A441'}"/>`;
    berries += `<circle cx="${(x - 0.25 * s).toFixed(2)}" cy="${(yy - 0.25 * s).toFixed(2)}" r="${(0.22 * s).toFixed(2)}" fill="#FFF3D1" opacity="0.7"/>`;
  }
  return back + front + berries;
}

export const DEFS = `
  <defs>
    <radialGradient id="flameGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFD98A" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="#FFC75A" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#FFC75A" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFE7A8" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#FFE7A8" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="wax" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="#E9DFCC"/>
      <stop offset="35%" stop-color="#FBF6EC"/>
      <stop offset="100%" stop-color="#DCD0BA"/>
    </linearGradient>
    <radialGradient id="warm" cx="50%" cy="82%" r="42%">
      <stop offset="0%" stop-color="#FFD98A" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#FFD98A" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

// The four candles in a row, the Hope candle first. `lit` is how many burn.
export function candleRow(cx, base, s, lit = 4, opts = {}) {
  const gap = 15 * s;
  const heights = [27, 24.5, 22, 19.5].map((h) => h * s);
  const xs = [-1.5, -0.5, 0.5, 1.5].map((k) => cx + k * gap);
  const garlandOpts = opts.garland === false ? null : opts.garland || {};
  return `
    ${xs.map((x, i) => candle(x, base, heights[i], s, WEEKS[i], i < lit, opts)).join('')}
    ${garlandOpts ? garland(cx - gap * 2.3, cx + gap * 2.3, base + 0.6 * s, s, 5, garlandOpts) : ''}`;
}

// A small candle set for interior pages: on white, with dark labels.
export function candleStrip(lit, { width = 60, label = true } = {}) {
  const s = width / 72;
  const h = 49 * s;
  return `<svg viewBox="0 0 ${width} ${h}" width="${width}mm" height="${h}mm" aria-hidden="true">
    ${DEFS}
    ${candleRow(width / 2, h - 12.5 * s, s, lit, { label, labelColor: '#5E6B70', garland: { dark: '#2E6A4E', light: '#4E8C6A' } })}
  </svg>`;
}
