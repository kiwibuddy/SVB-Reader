export const DEPTH_X = [30, 52, 74]; // division, book, story
export const THREAD_OVERHANG = 32;

/** Quarter-circle arc radius — matches card borderRadius for visual consistency. */
const R = 16;

/** Vertical gap between the last mark on a depth and the horizontal corridor. */
const GAP = 14;

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
 * Builds an SVG path using only horizontal lines, vertical lines, and
 * quarter-circle arcs. Marks sit at `markOffset` (or the row center) from the
 * top of each row. Optional entry/exit corridors run above the first row and
 * below the last row so they never cut through card text.
 *
 * Depth changes step at the **row boundary** (below the previous row’s text),
 * so the horizontal corridor never slices through blurbs or titles.
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
    // Keep the entry corridor above the first row so it never cuts through tall cards.
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
      // Same depth — straight vertical
      d += ` V ${m.y}`;
      length += Math.abs(m.y - prev.y);
    } else {
      // Depth change — rounded step at the row boundary so copy stays clear:
      // deeper = down → right → down; shallower = down → left → down.
      const goingRight = m.x > prev.x;
      const dx = Math.abs(m.x - prev.x);
      // Leave a short straight H so the step reads clearly (not a pure S-wave).
      const r = Math.min(R, Math.max(8, dx / 2 - 2));

      // Prefer the shared edge between rows; clamp so both arcs still fit.
      const minMid = prev.y + r + 4;
      const maxMid = m.y - r - 4;
      const boundary = prev.rowBottom;
      const midY =
        maxMid >= minMid ? Math.max(minMid, Math.min(maxMid, boundary)) : (prev.y + m.y) / 2;

      if (goingRight) {
        d += ` V ${midY - r}`;
        length += midY - r - prev.y;
        // down → right (clockwise quarter in SVG y-down)
        d += ` A ${r} ${r} 0 0 1 ${prev.x + r} ${midY}`;
        length += (Math.PI / 2) * r;
        const hTarget = m.x - r;
        if (hTarget > prev.x + r) {
          d += ` H ${hTarget}`;
          length += hTarget - (prev.x + r);
        }
        // right → down
        d += ` A ${r} ${r} 0 0 0 ${m.x} ${midY + r}`;
        length += (Math.PI / 2) * r;
        const afterArc = midY + r;
        if (m.y > afterArc) {
          d += ` V ${m.y}`;
          length += m.y - afterArc;
        }
      } else {
        d += ` V ${midY - r}`;
        length += midY - r - prev.y;
        // down → left
        d += ` A ${r} ${r} 0 0 0 ${prev.x - r} ${midY}`;
        length += (Math.PI / 2) * r;
        const hTarget = m.x + r;
        if (hTarget < prev.x - r) {
          d += ` H ${hTarget}`;
          length += prev.x - r - hTarget;
        }
        // left → down
        d += ` A ${r} ${r} 0 0 1 ${m.x} ${midY + r}`;
        length += (Math.PI / 2) * r;
        const afterArc = midY + r;
        if (m.y > afterArc) {
          d += ` V ${m.y}`;
          length += m.y - afterArc;
        }
      }
    }
    prev = m;
  }

  const publicMarks: ThreadMark[] = marks.map(({ key, x, y: my }) => ({ key, x, y: my }));

  if (exitSide === 'none') {
    return { d, length, marks: publicMarks, height: rowsBottom };
  }

  // Exit below the last row so the corridor never crosses card text.
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
