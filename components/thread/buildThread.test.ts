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
    // down→right then right→down: sweep 0 then 1 keeps the arc inside the step box
    expect(d).toContain(`A 16 16 0 0 0 ${DEPTH_X[1] + 16} ${ROW_HEIGHT.book}`);
    expect(d).toContain(`A 16 16 0 0 1 ${DEPTH_X[2]} ${ROW_HEIGHT.book + 16}`);
  });

  it('uses convex outer sweeps when stepping shallower', () => {
    const { d } = buildThread(
      [
        { key: 'story', depth: 2, height: ROW_HEIGHT.story },
        { key: 'book', depth: 1, height: ROW_HEIGHT.book },
      ],
      { entry: 'none', exit: 'none' }
    );
    expect(d).toContain(`A 16 16 0 0 1 ${DEPTH_X[2] - 16} ${ROW_HEIGHT.story}`);
    expect(d).toContain(`A 16 16 0 0 0 ${DEPTH_X[1]} ${ROW_HEIGHT.story + 16}`);
  });
});
