export function openSegment(
  router: { push: (href: any) => void },
  storyId: string,
  extra?: {
    planId?: string;
    challengeId?: string;
    voice?: string;
    chapter?: number;
    verse?: number;
    partner?: string;
    locate?: 'speech' | 'exchange';
  }
) {
  const id = storyId.match(/[SI]\d+/i)?.[0] || storyId;
  router.push({
    pathname: '/[segment]',
    params: {
      segment: id,
      ...(extra?.planId ? { planId: extra.planId } : {}),
      ...(extra?.challengeId ? { challengeId: extra.challengeId } : {}),
      ...(extra?.voice ? { voice: extra.voice } : {}),
      ...(extra?.partner ? { partner: extra.partner } : {}),
      ...(extra?.locate ? { locate: extra.locate } : {}),
      ...(extra?.chapter != null && extra?.verse != null
        ? { chapter: String(extra.chapter), verse: String(extra.verse) }
        : {}),
    },
  });
}
