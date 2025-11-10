import { Signal } from '@/types';

type Grouping = 'source' | 'topic' | 'title' | 'keyword';

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9가-힣\s]/gi, ' ').replace(/\s+/g, ' ').trim();
}

function hasKeywordMatch(text: string, keywords: string[]): boolean {
  const n = normalize(text);
  return keywords.some((kw) => n.includes(normalize(kw)));
}

function overlapCount(a: string[], b: string[]): number {
  if (!a || !b) return 0;
  const setB = new Set(b.map((t) => normalize(t)));
  return a.reduce((acc, t) => (setB.has(normalize(t)) ? acc + 1 : acc), 0);
}

function scoreByGrouping(
  base: Signal,
  candidate: Signal,
  grouping: Grouping,
  customKeywords: string[]
): number {
  if (base.id === candidate.id) return 0;

  let score = 0;

  // Base tag/keyword overlap always contributes a bit
  score += overlapCount(base.tags || [], candidate.tags || []) * 2;

  switch (grouping) {
    case 'source':
      if (base.sourceName && candidate.sourceName && base.sourceName === candidate.sourceName) {
        score += 5;
      }
      break;
    case 'topic':
      // Treat first tag as topic if present
      if (base.tags?.[0] && candidate.tags?.includes(base.tags[0])) {
        score += 6;
      }
      break;
    case 'title':
      if (base.title && candidate.title) {
        const baseWords = normalize(base.title).split(' ').filter(Boolean);
        const candWords = normalize(candidate.title).split(' ').filter(Boolean);
        score += overlapCount(baseWords, candWords);
      }
      break;
    case 'keyword':
      if (customKeywords?.length) {
        const baseText = `${base.title || ''} ${base.summary || ''}`;
        const candText = `${candidate.title || ''} ${candidate.summary || ''}`;
        if (hasKeywordMatch(baseText, customKeywords)) score += 3;
        if (hasKeywordMatch(candText, customKeywords)) score += 3;
      }
      break;
    default:
      break;
  }

  return score;
}

export const echoControlService = {
  findRelatedArticles(
    base: Signal,
    all: Signal[],
    grouping: Grouping,
    customKeywords: string[] = [],
    limit: number = 3
  ): Signal[] {
    if (!all?.length) return [];
    const scored = all
      .filter((s) => s.id !== base.id)
      .map((s) => ({ s, score: scoreByGrouping(base, s, grouping, customKeywords) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.s);
    return scored;
  },
};

export default echoControlService;