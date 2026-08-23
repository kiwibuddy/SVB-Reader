export const DEPTH_X = [30, 52, 74]; // division, book, story
export const THREAD_OVERHANG = 32;

/** Quarter-circle arc radius — entry/exit corridors only. */
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

/**
 * Builds an SVG path. Same-depth stretches stay vertical. Depth changes are a
 * single straight segment between beads — no arcs or S-bows in the spine.
 * Optional entry/exit corridors run above the first row and below the last row
 * so they never cut through card text.
 */
export function buildThread(
  rows: ThreadRow[],
  opts?: { width?: number; exit?: 'left' | 'right' | 'none'; entry?: 'left' | 'none' },
) {
  const width = Math.max(opts?.width ?? 390, 200);
  const exitSide = opts?.exit ?? 'left';
  const entrySide = opts?.entry ?? 'left';
  let y = 0;
  const marks: ThreadMark[] = rows.map((r) => {
    const markOffset = r.markOffset ?? r.height / 2;
    const mark: ThreadMark = {
      key: r.key,
      x: DEPTH_X[r.depth],
      y: y + markOffset,
    };
    y += r.height;
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
      // Depth change — one straight segment between beads (no bow, no stair arcs).
      d += ` L ${m.x} ${m.y}`;
      length += Math.hypot(m.x - prev.x, m.y - prev.y);
    }
    prev = m;
  }

  if (exitSide === 'none') {
    return { d, length, marks, height: rowsBottom };
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

  return { d, length, marks, height: rowsBottom + GAP + R };
}
