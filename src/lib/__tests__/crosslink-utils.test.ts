import { describe, it, expect } from 'vitest';
import {
  tokenize,
  jaccardSimilarity,
  unifiedTagsForWeek,
  relevanceScore,
  inferUnifiedTagKeys,
} from '../crosslink-utils';

describe('tokenize', () => {
  it('extracts Korean tokens of length >= 2', () => {
    const tokens = tokenize('임신 초기 영양');
    expect(tokens).toContain('초기');
    expect(tokens).toContain('영양');
  });

  it('filters Korean stopwords', () => {
    const tokens = tokenize('임신 출산 아기');
    expect(tokens).not.toContain('임신');
    expect(tokens).not.toContain('출산');
    expect(tokens).not.toContain('아기');
  });

  it('extracts English tokens of length >= 3, lowercased', () => {
    const tokens = tokenize('NIPT Test Pregnancy');
    expect(tokens).toContain('nipt');
    expect(tokens).toContain('test');
    expect(tokens).toContain('pregnancy');
  });

  it('filters English stopwords', () => {
    const tokens = tokenize('the and for pregnancy');
    expect(tokens).not.toContain('the');
    expect(tokens).not.toContain('and');
    expect(tokens).not.toContain('for');
    expect(tokens).toContain('pregnancy');
  });

  it('dedupes repeated tokens', () => {
    const tokens = tokenize('영양 영양 영양');
    expect(tokens.filter((t) => t === '영양')).toHaveLength(1);
  });
});

describe('jaccardSimilarity', () => {
  it('returns 0 for both empty', () => {
    expect(jaccardSimilarity([], [])).toBe(0);
  });

  it('returns 1 for identical sets', () => {
    expect(jaccardSimilarity(['a', 'b'], ['a', 'b'])).toBe(1);
  });

  it('returns 0 for disjoint sets', () => {
    expect(jaccardSimilarity(['a'], ['b'])).toBe(0);
  });

  it('handles partial overlap', () => {
    expect(jaccardSimilarity(['a', 'b'], ['b', 'c'])).toBeCloseTo(1 / 3);
  });
});

describe('unifiedTagsForWeek', () => {
  it.each([
    [-1, []],
    [0, []],
    [1, ['pregnancy-early']],
    [13, ['pregnancy-early']],
    [14, ['pregnancy-mid']],
    [27, ['pregnancy-mid']],
    [28, ['birth-prep']],
    [40, ['birth-prep']],
  ])('week %i -> %j', (week, expected) => {
    expect(unifiedTagsForWeek(week)).toEqual(expected);
  });
});

describe('relevanceScore', () => {
  it('combines tag (0.6) and keyword (0.4) by default', () => {
    const a = { unifiedTags: ['x'], keywords: ['y'] };
    const b = { unifiedTags: ['x'], keywords: ['y'] };
    expect(relevanceScore(a, b)).toBeCloseTo(1.0);
  });

  it('weights tags more than keywords (default)', () => {
    const a = { unifiedTags: ['x'], keywords: [] };
    const b = { unifiedTags: ['x'], keywords: [] };
    expect(relevanceScore(a, b)).toBeCloseTo(0.6);
  });

  it('respects custom weights', () => {
    const a = { unifiedTags: ['x'], keywords: ['y'] };
    const b = { unifiedTags: ['x'], keywords: ['y'] };
    expect(relevanceScore(a, b, { tag: 1, keyword: 0 })).toBeCloseTo(1.0);
  });
});

describe('inferUnifiedTagKeys', () => {
  it('infers from text content', () => {
    const keys = inferUnifiedTagKeys({ text: '임신초기에 영양을 챙기자' });
    expect(keys).toContain('pregnancy-early');
    expect(keys).toContain('nutrition');
  });

  it('infers from articleTags', () => {
    const keys = inferUnifiedTagKeys({ articleTags: ['보험'] });
    expect(keys).toContain('insurance');
  });

  it('returns empty when nothing matches', () => {
    expect(inferUnifiedTagKeys({ text: 'random unrelated' })).toEqual([]);
  });
});
