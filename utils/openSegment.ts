export function openSegment(
  router: { push: (href: any) => void },
  storyId: string,
  extra?: { planId?: string; challengeId?: string; voice?: string; pos?: number }
) {
  const id = storyId.match(/[SI]\d+/i)?.[0] || storyId;
  router.push({
    pathname: '/[segment]',
    params: {
      segment: id,
      ...(extra?.planId ? { planId: extra.planId } : {}),
      ...(extra?.challengeId ? { challengeId: extra.challengeId } : {}),
      ...(extra?.voice ? { voice: extra.voice } : {}),
      ...(extra?.pos != null ? { pos: String(extra.pos) } : {}),
    },
  });
}
