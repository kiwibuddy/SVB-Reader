import type { BibleBlock } from '@/types';

/** Pull plain text out of a block tree (leaves with `text`). */
function visibleText(node: unknown): string {
  const parts: string[] = [];
  const walk = (value: unknown) => {
    if (value == null) return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (typeof value !== 'object') return;
    const obj = value as Record<string, unknown>;
    if (typeof obj.text === 'string') parts.push(obj.text);
    for (const child of Object.values(obj)) walk(child);
  };
  walk(node);
  return parts.join('');
}

/** NLT separator rows are only dashes / brackets — not speech. */
function isSeparatorOnly(text: string): boolean {
  const compact = text.replace(/\s+/g, '');
  return !compact || /^[-–—\[\]*.…]+$/.test(compact);
}

/**
 * Bible JSON sometimes stores `source` as a bare string (`"Editorial Insert"`,
 * `"Psalm Title"`). Destructuring that as `{ sourceName }` falls through to
 * "Unknown" and paints manuscript notes as speech bubbles.
 */
export function normalizeBibleContent(content: BibleBlock[] | unknown): BibleBlock[] {
  if (!Array.isArray(content)) return [];

  const out: BibleBlock[] = [];
  for (const raw of content) {
    if (!raw || typeof raw !== 'object') continue;
    const block = raw as BibleBlock & { source?: unknown };
    const src = block.source;

    if (typeof src === 'string') {
      if (src === 'Editorial Insert') {
        if (isSeparatorOnly(visibleText(block))) continue;
        out.push({
          ...block,
          source: { color: 'black', sourceName: '', kind: 'editorial' },
        });
        continue;
      }
      if (src === 'Psalm Title') {
        out.push({
          ...block,
          source: { color: 'black', sourceName: 'Psalm Title', kind: 'title' },
        });
        continue;
      }
      out.push({
        ...block,
        source: { color: 'black', sourceName: src },
      });
      continue;
    }

    if (src && typeof src === 'object') {
      const name = String((src as { sourceName?: string }).sourceName || '').trim();
      if (!name || name === 'undefined') {
        if (isSeparatorOnly(visibleText(block))) continue;
        out.push({
          ...block,
          source: { ...src, color: (src as { color?: string }).color || 'black', sourceName: '', kind: 'editorial' },
        });
        continue;
      }
    }

    out.push(block);
  }
  return out;
}
