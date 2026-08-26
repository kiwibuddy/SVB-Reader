export const DEPTH_X = [30, 70, 110]; // division, book, story — 40px so a 16px corner + horizontal fits
export const THREAD_OVERHANG = 32;

/** Quarter-circle radius — same as the entry/exit corridors. */
const R = 16;

/** Vertical gap between the last mark on a depth and the horizontal corridor. */
const GAP = 14;

/** Straight horizontal between the two corner arcs on a depth step. */
const MIN_STEP_H = 8;

/** Straight vertical before/after the corridor so arcs don't reverse. */
const MIN_STEP_V = 4;

export const ROW_HEIGHT = {
  division: 46,
  book: 46,
  story: 44,
  current: 58,
} as const;

export type ThreadRow = {
  key: string;
  depth: 0 | 1 | 2;
  height: number;
  /** Distance from the top of the row to the bead. Defaults to the vertical center. */
  markOffset?: number;
};

export type ThreadMark = { key: string; x: number; y: number };

type PathMark = ThreadMark & { rowTop: number; rowBottom: number };

/**
 * Corner radius for a depth step: keep a clear H corridor, and shrink when the
 * vertical span between beads is too short for two full arcs.
 */
function stepRadius(dx: number, dy: number): number {
  const byWidth = Math.max(4, (dx - MIN_STEP_H) / 2);
  const byHeight = Math.max(1, dy / 2 - 0.5);
  return Math.max(1, Math.floor(Math.min(R, byWidth, byHeight)));
}

/**
 * Horizontal corridor Y. Prefer the shared row boundary so titles stay clear;
 * fall back to the bead midpoint when the row is too short.
 */
function stepMidY(prev: PathMark, next: PathMark, r: number): number {
  const dy = next.y - prev.y;
  const pad = Math.min(MIN_STEP_V, Math.max(0, (dy - 2 * r) / 2));
  const minMid = prev.y + r + pad;
  const maxMid = next.y - r - pad;
  if (maxMid < minMid) {
    return (prev.y + next.y) / 2;
  }
  const boundary = prev.rowBottom;
  if (boundary >= minMid && boundary <= maxMid) {
    return boundary;
  }
  const classic = (prev.y + next.y) / 2;
  return Math.max(minMid, Math.min(maxMid, classic));
}

/**
 * Builds an SVG path from horizontal lines, vertical lines, and quarter-circle
 * arcs — the same rounded-corner language as the entry. Same-depth stretches
 * stay vertical. Depth changes step at the row boundary: down, round, across,
 * round, down. Never a diagonal.
 */
export function buildThread(
  rows: ThreadRow[],
  opts?: { width?: number; exit?: 'left' | 'right' | 'none'; entry?: 'left' | 'none' },
) {
  const width = Math.max(opts?.width ?? 390, 200);
  const exitSide = opts?.exit ?? 'left';
  const entrySide = opts?.entry ?? 'left';
  let y = 0;
  const marks: PathMark[] = rows.map((r) => {
    const markOffset = r.markOffset ?? r.height / 2;
    const rowTop = y;
    const rowBottom = y + r.height;
    const mark: PathMark = {
      key: r.key,
      x: DEPTH_X[r.depth],
      y: rowTop + markOffset,
      rowTop,
      rowBottom,
    };
    y = rowBottom;
    return mark;
  });
  if (!marks.length) return { d: '', length: 0, marks: [] as ThreadMark[], height: 0 };

  let d = '';
  let length = 0;

  const firstMark = marks[0];
  const rowsBottom = y;

  if (entrySide === 'none') {
    d = `M ${firstMark.x} ${firstMark.y}`;
  } else {
    const startX = -THREAD_OVERHANG;
    const entryY = Math.min(firstMark.y - R, 0);
    d = `M ${startX} ${entryY}`;
    const hEnd = firstMark.x - R;
    d += ` H ${hEnd}`;
    length += hEnd - startX;
    d += ` A ${R} ${R} 0 0 1 ${firstMark.x} ${entryY + R}`;
    length += (Math.PI / 2) * R;
    if (firstMark.y > entryY + R) {
      d += ` V ${firstMark.y}`;
      length += firstMark.y - (entryY + R);
    }
  }

  let prev = firstMark;

  for (let i = 1; i < marks.length; i += 1) {
    const m = marks[i];

    if (m.x === prev.x) {
      d += ` V ${m.y}`;
      length += Math.abs(m.y - prev.y);
    } else {
      const goingRight = m.x > prev.x;
      const dx = Math.abs(m.x - prev.x);
      const dy = Math.max(1, m.y - prev.y);
      const r = stepRadius(dx, dy);
      const midY = stepMidY(prev, m, r);
      const beforeArc = midY - r;
      const afterArc = midY + r;

      if (beforeArc > prev.y) {
        d += ` V ${beforeArc}`;
        length += beforeArc - prev.y;
      }

      // Sweep flags keep each quarter-circle inside the step rectangle
      // [min(x), max(x)] × [prev.y, next.y] — convex outer rounds like the
      // entry corner, not the inverted left/right scoop (S-bow).
      if (goingRight) {
        d += ` A ${r} ${r} 0 0 0 ${prev.x + r} ${midY}`;
        length += (Math.PI / 2) * r;
        const hTarget = m.x - r;
        if (hTarget > prev.x + r) {
          d += ` H ${hTarget}`;
          length += hTarget - (prev.x + r);
        }
        d += ` A ${r} ${r} 0 0 1 ${m.x} ${afterArc}`;
        length += (Math.PI / 2) * r;
      } else {
        d += ` A ${r} ${r} 0 0 1 ${prev.x - r} ${midY}`;
        length += (Math.PI / 2) * r;
        const hTarget = m.x + r;
        if (hTarget < prev.x - r) {
          d += ` H ${hTarget}`;
          length += prev.x - r - hTarget;
        }
        d += ` A ${r} ${r} 0 0 0 ${m.x} ${afterArc}`;
        length += (Math.PI / 2) * r;
      }

      if (m.y > afterArc) {
        d += ` V ${m.y}`;
        length += m.y - afterArc;
      }
    }
    prev = m;
  }

  const publicMarks: ThreadMark[] = marks.map(({ key, x, y: my }) => ({ key, x, y: my }));

  if (exitSide === 'none') {
    return { d, length, marks: publicMarks, height: rowsBottom };
  }

  const exitTurnY = rowsBottom + GAP;
  if (exitTurnY > prev.y) {
    d += ` V ${exitTurnY}`;
    length += exitTurnY - prev.y;
  }
  if (exitSide === 'right') {
    d += ` A ${R} ${R} 0 0 0 ${prev.x + R} ${exitTurnY + R}`;
    length += (Math.PI / 2) * R;
    const exitX = width + THREAD_OVERHANG;
    d += ` H ${exitX}`;
    length += exitX - (prev.x + R);
  } else {
    d += ` A ${R} ${R} 0 0 1 ${prev.x - R} ${exitTurnY + R}`;
    length += (Math.PI / 2) * R;
    const exitX = -THREAD_OVERHANG;
    d += ` H ${exitX}`;
    length += prev.x - R - exitX;
  }

  return { d, length, marks: publicMarks, height: rowsBottom + GAP + R };
}
