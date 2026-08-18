import FRA_UI from '@/assets/data/FRA-UI.json';

export function localizeVoiceName(name: string, language: string): string {
  if (!language.startsWith('fr')) return name;
  const sources = (FRA_UI as { Sources?: Record<string, string> }).Sources;
  return sources?.[name] || name;
}

export function localizeStoryTitle(segmentId: string, englishTitle: string, language: string): string {
  if (!language.startsWith('fr')) return englishTitle;
  const fr = (FRA_UI as Record<string, unknown>)[segmentId];
  return typeof fr === 'string' ? fr : englishTitle;
}

export function formatCount(n: number): string {
  return n.toLocaleString();
}
