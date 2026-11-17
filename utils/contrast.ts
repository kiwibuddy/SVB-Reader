/**
 * Adjust a brand colour until text in it is readable on a background.
 * Plan phase colours (gold, brown, purple…) are picked for their meaning, not
 * for contrast; this keeps their hue and only darkens or lightens them.
 */

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: string, b: string): number {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return 21;
  const la = luminance(ca);
  const lb = luminance(cb);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** `color`, mixed toward black (light backgrounds) or white (dark ones) until it reaches `min` contrast. */
export function readableOn(color: string, background: string, min = 4.5): string {
  const c = parseHex(color);
  const bg = parseHex(background);
  if (!c || !bg) return color;
  if (contrastRatio(color, background) >= min) return color;
  const target: [number, number, number] = luminance(bg) > 0.5 ? [0, 0, 0] : [255, 255, 255];
  for (let step = 1; step <= 20; step++) {
    const t = step / 20;
    const mixed: [number, number, number] = [
      c[0] + (target[0] - c[0]) * t,
      c[1] + (target[1] - c[1]) * t,
      c[2] + (target[2] - c[2]) * t,
    ];
    const hex = toHex(mixed);
    if (contrastRatio(hex, background) >= min) return hex;
  }
  return toHex(target);
}
