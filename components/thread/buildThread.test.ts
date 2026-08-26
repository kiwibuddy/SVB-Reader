import { DEPTH_X, ROW_HEIGHT, buildThread } from '@/components/thread/buildThread';

describe('buildThread depth steps', () => {
  it('uses vertical, horizontal, and rounded corners — never a diagonal', () => {
    const { d } = buildThread(
      [
        { key: 'd', depth: 0, height: ROW_HEIGHT.division },
        { key: 'b', depth: 1, height: ROW_HEIGHT.book },
        { key: 's', depth: 2, height: ROW_HEIGHT.story },
      ],
      { entry: 'none', exit: 'none' }
    );
    expect(d).not.toMatch(/ L /);
    expect(d).toMatch(/ V /);
    expect(d).toMatch(/ H /);
    expect(d).toMatch(/ A 16 16 /);
  });

  it('uses convex outer sweeps (not inverted scoops) when stepping deeper', () => {
    const { d } = buildThread(
      [
        { key: 'book', depth: 1, height: ROW_HEIGHT.book },
        { key: 'story', depth: 2, height: ROW_HEIGHT.story },
      ],
      { entry: 'none', exit: 'none' }
    );
    expect(d).toContain(`A 16 16 0 0 0 ${DEPTH_X[1] + 16} ${ROW_HEIGHT.book}`);
    expect(d).toContain(`A 16 16 0 0 1 ${DEPTH_X[2]} ${ROW_HEIGHT.book + 16}`);
  });

  it('enters from the left and exits to the right like Cast', () => {
    const width = 390;
    const { d, height } = buildThread(
      [
        { key: 'voice', depth: 0, height: 56 },
        { key: 's1', depth: 2, height: ROW_HEIGHT.story },
        { key: 's2', depth: 2, height: ROW_HEIGHT.story },
      ],
      { width, entry: 'left', exit: 'right' }
    );
    expect(d.startsWith('M -32 ')).toBe(true);
    expect(d).toContain(`H ${width + 32}`);
    const rowsBottom = 56 + ROW_HEIGHT.story * 2;
    expect(height).toBe(rowsBottom + 6 + 16 + 16);
  });
});
