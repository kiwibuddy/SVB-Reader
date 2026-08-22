export const DEPTH_X = [30, 52, 74]; // division, book, story
export const THREAD_OVERHANG = 32;

/** Quarter-circle arc radius — matches card borderRadius for visual consistency. */
const R = 16;

/** Vertical gap between the last mark on a depth and the horizontal corridor. */
const GAP = 12;

export const ROW_HEIGHT = {
  division: 46,
  book: 46,
  story: 44,
  current: 58,
} as const;

export type ThreadRow = { key: string; depth: 0 | 1 | 2; height: number };

export type ThreadMark = { key: string; x: number; y: number };

/**
 * Builds an SVG path using only horizontal lines, vertical lines, and
 * quarter-circle arcs. Marks are placed at the vertical center of each row
 * starting at y=0 (matching the layout). The entry path extends into negative
 * Y space (handled by SVG overflow: visible).
 */
export function buildThread(
  rows: ThreadRow[],
  opts?: { width?: number; exit?: 'left' | 'right' },
) {
  const width = Math.max(opts?.width ?? 390, 200);
  const exitSide = opts?.exit ?? 'left';
  let y = 0;
  const marks: ThreadMark[] = rows.map((r) => {
    const mark = { key: r.key, x: DEPTH_X[r.depth], y: y + r.height / 2 };
    y += r.height;
    return mark;
  });
  if (!marks.length) return { d: '', length: 0, marks, height: 0 };

  let d = '';
  let length = 0;

  const firstMark = marks[0];
  const startX = -THREAD_OVERHANG;

  // Entry: horizontal line at R above first mark, arc down, vertical to first mark
  const entryY = firstMark.y - R;
  d = `M ${startX} ${entryY}`;
  const hEnd = firstMark.x - R;
  d += ` H ${hEnd}`;
  length += hEnd - startX;
  // Arc: right → down
  d += ` A ${R} ${R} 0 0 1 ${firstMark.x} ${entryY + R}`;
  length += (Math.PI / 2) * R;
  // Now at firstMark position exactly

  let prev = firstMark;

  for (let i = 1; i < marks.length; i += 1) {
    const m = marks[i];

    if (m.x === prev.x) {
      // Same depth — straight vertical
      d += ` V ${m.y}`;
      length += Math.abs(m.y - prev.y);
    } else {
      // Depth change
      const goingRight = m.x > prev.x;
      const dx = Math.abs(m.x - prev.x);
      const r = Math.min(R, dx / 2);

      // Place the horizontal corridor between prev and m
      // midway vertically, but at least GAP below prev and GAP+2r above m
      const midY = prev.y + GAP + r;

      if (goingRight) {
        // Vertical to corridor start
        d += ` V ${midY - r}`;
        length += (midY - r) - prev.y;
        // Arc: down → right
        d += ` A ${r} ${r} 0 0 0 ${prev.x + r} ${midY}`;
        length += (Math.PI / 2) * r;
        // Horizontal
        const hTarget = m.x - r;
        if (hTarget > prev.x + r) {
          d += ` H ${hTarget}`;
          length += hTarget - (prev.x + r);
        }
        // Arc: right → down
        d += ` A ${r} ${r} 0 0 1 ${m.x} ${midY + r}`;
        length += (Math.PI / 2) * r;
        // Vertical to mark
        const afterArc = midY + r;
        if (m.y > afterArc) {
          d += ` V ${m.y}`;
          length += m.y - afterArc;
        }
      } else {
        // Vertical to corridor start
        d += ` V ${midY - r}`;
        length += (midY - r) - prev.y;
        // Arc: down → left
        d += ` A ${r} ${r} 0 0 1 ${prev.x - r} ${midY}`;
        length += (Math.PI / 2) * r;
        // Horizontal
        const hTarget = m.x + r;
        if (hTarget < prev.x - r) {
          d += ` H ${hTarget}`;
          length += (prev.x - r) - hTarget;
        }
        // Arc: left → down
        d += ` A ${r} ${r} 0 0 0 ${m.x} ${midY + r}`;
        length += (Math.PI / 2) * r;
        // Vertical to mark
        const afterArc = midY + r;
        if (m.y > afterArc) {
          d += ` V ${m.y}`;
          length += m.y - afterArc;
        }
      }
    }
    prev = m;
  }

  // Exit: vertical down GAP past last mark, then arc and horizontal off-screen
  const exitTurnY = prev.y + GAP;
  d += ` V ${exitTurnY}`;
  length += GAP;
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
    length += (prev.x - R) - exitX;
  }

  // Height includes the exit arc below the last row
  const totalHeight = y + GAP + R;
  return { d, length, marks, height: totalHeight };
}
