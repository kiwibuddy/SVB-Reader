export const DEPTH_X = [30, 52, 74]; // division, book, story
const BOW = 18; // vertical control-point offset

export const ROW_HEIGHT = {
  division: 46,
  book: 46,
  story: 44,
  current: 58,
} as const;

export type ThreadRow = { key: string; depth: 0 | 1 | 2; height: number };

export type ThreadMark = { key: string; x: number; y: number };

export function buildThread(rows: ThreadRow[]) {
  let y = 0;
  const marks: ThreadMark[] = rows.map((r) => {
    const mark = { key: r.key, x: DEPTH_X[r.depth], y: y + r.height / 2 };
    y += r.height;
    return mark;
  });
  if (!marks.length) return { d: '', length: 0, marks, height: 0 };

  let d = `M ${marks[0].x} 0`;
  let length = marks[0].y;
  let prev = { x: marks[0].x, y: 0 };

  for (const m of marks) {
    if (m.x === prev.x) {
      d += ` L ${m.x} ${m.y}`;
      length += Math.abs(m.y - prev.y);
    } else {
      d += ` C ${prev.x} ${prev.y + BOW} ${m.x} ${m.y - BOW} ${m.x} ${m.y}`;
      length += Math.hypot(m.x - prev.x, m.y - prev.y) * 1.08; // chord + 8%
    }
    prev = m;
  }
  d += ` L ${prev.x} ${y}`;
  length += Math.abs(y - prev.y);

  return { d, length, marks, height: y };
}
