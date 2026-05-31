import { describe, it, expect } from 'vitest';
import {
  getRelatedArticles,
  getRelatedChecklists,
} from '../related-content';
import type { ArticleMeta } from '@/types/article';
import type { ChecklistMeta } from '@/types/checklist';

function makeArticle(
  slug: string,
  tags: string[],
  date = '2026-01-01',
): ArticleMeta {
  return {
    slug,
    title: slug,
    description: '',
    tags,
    date,
    canonical: `/articles/${slug}`,
  };
}

describe('getRelatedArticles', () => {
  it('excludes the current article from results', () => {
    const current = makeArticle('me', ['x']);
    const others = [makeArticle('other', ['x'])];
    const result = getRelatedArticles(current, [current, ...others]);
    expect(result.map((a) => a.slug)).not.toContain('me');
  });

  it('ranks higher overlap first', () => {
    const current = makeArticle('me', ['a', 'b', 'c']);
    const all = [
      current,
      makeArticle('low', ['a']),
      makeArticle('high', ['a', 'b', 'c']),
      makeArticle('mid', ['a', 'b']),
    ];
    const result = getRelatedArticles(current, all);
    expect(result.map((a) => a.slug)).toEqual(['high', 'mid', 'low']);
  });

  it('breaks ties by newest date', () => {
    const current = makeArticle('me', ['x']);
    const all = [
      current,
      makeArticle('old', ['x'], '2024-01-01'),
      makeArticle('new', ['x'], '2026-05-01'),
    ];
    const result = getRelatedArticles(current, all);
    expect(result[0].slug).toBe('new');
  });

  it('fills with zero-score articles when matches < limit', () => {
    const current = makeArticle('me', ['x']);
    const all = [
      current,
      makeArticle('match', ['x']),
      makeArticle('nomatch1', ['y'], '2026-05-01'),
      makeArticle('nomatch2', ['z'], '2024-01-01'),
    ];
    const result = getRelatedArticles(current, all, 3);
    expect(result).toHaveLength(3);
    expect(result[0].slug).toBe('match');
    expect(result[1].slug).toBe('nomatch1');
  });

  it('respects the limit parameter', () => {
    const current = makeArticle('me', ['x']);
    const all = [
      current,
      makeArticle('a', ['x']),
      makeArticle('b', ['x']),
      makeArticle('c', ['x']),
    ];
    expect(getRelatedArticles(current, all, 2)).toHaveLength(2);
  });
});

describe('getRelatedChecklists', () => {
  it('returns checklists that link to the article slug', () => {
    const checklists: ChecklistMeta[] = [
      {
        slug: 'a',
        title: 'A',
        description: '',
        icon: '',
        subcategories: [],
        linked_article_slugs: ['target'],
      },
      {
        slug: 'b',
        title: 'B',
        description: '',
        icon: '',
        subcategories: [],
        linked_article_slugs: ['other'],
      },
    ];
    const result = getRelatedChecklists('target', checklists);
    expect(result.map((c) => c.slug)).toEqual(['a']);
  });

  it('handles checklists with no linked_article_slugs', () => {
    const checklists: ChecklistMeta[] = [
      {
        slug: 'a',
        title: 'A',
        description: '',
        icon: '',
        subcategories: [],
      },
    ];
    expect(getRelatedChecklists('any', checklists)).toEqual([]);
  });
});
