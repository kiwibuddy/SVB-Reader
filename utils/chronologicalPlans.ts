import mappings from '@/assets/data/ChronologicalMappings.json';

type PhaseDef = { description: string; color: string };
type SegmentDef = {
  segmentId: string;
  book: string;
  title?: string;
  ref?: string;
  phase: string;
};

export type ChronologicalMapping = {
  title: string;
  description: string;
  longDescription?: string;
  phases: Record<string, PhaseDef>;
  segments: SegmentDef[];
};

export type ChronologicalPhase = {
  key: string;
  title: string;
  description: string;
  color: string;
  storyIds: string[];
};

const MAPPINGS = mappings as Record<string, ChronologicalMapping>;

export function getChronologicalMapping(id?: string | null): ChronologicalMapping | undefined {
  if (!id) return undefined;
  return MAPPINGS[id];
}

export function chronologicalStoryIds(mappingId?: string | null): string[] {
  const mapping = getChronologicalMapping(mappingId);
  if (!mapping) return [];
  return mapping.segments
    .map((segment) => segment.segmentId)
    .filter((id) => typeof id === 'string' && id.startsWith('S'));
}

export function getChronologicalPhases(
  mappingId: string | undefined,
  localize: (phaseKey: string, field: 'title' | 'description', fallback: string) => string
): ChronologicalPhase[] {
  const mapping = getChronologicalMapping(mappingId);
  if (!mapping?.phases) return [];

  const byPhase: Record<string, string[]> = {};
  for (const segment of mapping.segments || []) {
    if (!segment?.phase || !segment.segmentId) continue;
    (byPhase[segment.phase] ||= []).push(segment.segmentId);
  }

  return Object.keys(mapping.phases)
    .map((key) => {
      const phase = mapping.phases[key];
      return {
        key,
        title: localize(key, 'title', key),
        description: localize(key, 'description', phase?.description || ''),
        color: phase?.color || '#888888',
        storyIds: byPhase[key] || [],
      };
    })
    .filter((phase) => phase.storyIds.length > 0);
}
