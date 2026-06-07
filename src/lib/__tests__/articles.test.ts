import { describe, it, expect } from 'vitest';
import { countWords } from '../articles';

describe('countWords', () => {
  it('counts whitespace-separated tokens in plain text', () => {
    expect(countWords('hello world foo bar')).toBe(4);
  });

  it('counts Korean 어절 tokens by whitespace', () => {
    expect(countWords('임신 초기 영양제 가이드')).toBe(4);
  });

  it.each([
    ['', 0],
    ['   ', 0],
    ['\n\n\t  \n', 0],
    ['word', 1],
    ['a b', 2],
  ])('boundary %j -> %i', (input, expected) => {
    expect(countWords(input)).toBe(expected);
  });

  it('strips fenced code blocks entirely (content inside not counted)', () => {
    const md = [
      'before block',
      '```ts',
      'const x = 1;',
      'function foo() { return x; }',
      '```',
      'after block',
    ].join('\n');
    expect(countWords(md)).toBe(4);
  });

  it('strips inline code spans (backtick content not counted)', () => {
    expect(countWords('use `getAllArticles()` to fetch')).toBe(3);
  });

  it('strips markdown images (alt text not counted)', () => {
    expect(countWords('foo ![alt text here](/path/to.webp) bar')).toBe(2);
  });

  it('handles multiple code fences in one document', () => {
    const md = [
      'intro one',
      '```',
      'noise',
      '```',
      'middle two',
      '```py',
      'more noise',
      '```',
      'tail three',
    ].join('\n');
    expect(countWords(md)).toBe(6);
  });

  it('mixed: image + inline code + fence + prose', () => {
    const md = [
      'real prose words here',
      '![ignore me](x.webp)',
      'use `noise` token',
      '```',
      'big code block',
      '```',
      'tail end',
    ].join('\n');
    expect(countWords(md)).toBe(8);
  });

  it('collapses repeated whitespace and newlines to single token boundaries', () => {
    expect(countWords('one    two\n\nthree\t\tfour')).toBe(4);
  });

  it('invariant: result is always a non-negative integer', () => {
    for (const input of ['', 'a', 'a b c', '```\n\n```', '![](x)']) {
      const n = countWords(input);
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(0);
    }
  });

  it('invariant: stripping is idempotent — running twice gives same count', () => {
    const md = 'before `inline` ![a](x) text';
    expect(countWords(md)).toBe(countWords(md));
  });
});
