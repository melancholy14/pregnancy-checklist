import { describe, it, expect } from 'vitest';
import { countWords, parseArticleMeta, faqAnswerToPlainText } from '../articles';

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

describe('parseArticleMeta — faq branch', () => {
  const baseFrontmatter = {
    title: 'T',
    description: 'D',
    slug: 'sample-slug',
    tags: ['a'],
    date: '2026-01-01',
  };

  describe('happy path', () => {
    it('passes through a single-item faq array unchanged', () => {
      const meta = parseArticleMeta({
        ...baseFrontmatter,
        faq: [{ q: 'Q1', a: 'A1' }],
      });
      expect(meta.faq).toEqual([{ q: 'Q1', a: 'A1' }]);
    });

    it('preserves length and order for a 5-item array', () => {
      const items = Array.from({ length: 5 }, (_, i) => ({
        q: `Q${i + 1}`,
        a: `A${i + 1}`,
      }));
      const meta = parseArticleMeta({ ...baseFrontmatter, faq: items });
      expect(meta.faq).toHaveLength(5);
      expect(meta.faq?.[0].q).toBe('Q1');
      expect(meta.faq?.[4].a).toBe('A5');
    });
  });

  describe('boundary', () => {
    it('returns undefined when faq key is absent', () => {
      const meta = parseArticleMeta(baseFrontmatter);
      expect(meta.faq).toBeUndefined();
    });

    it('returns undefined when faq is explicit null', () => {
      const meta = parseArticleMeta({ ...baseFrontmatter, faq: null });
      expect(meta.faq).toBeUndefined();
    });

    it('returns undefined when faq is an empty array (treat as not-present)', () => {
      const meta = parseArticleMeta({ ...baseFrontmatter, faq: [] });
      expect(meta.faq).toBeUndefined();
    });
  });

  describe('malformed → throw', () => {
    it.each<[string, unknown]>([
      ['string (not array)', 'not-array'],
      ['object (not array)', { q: 'x', a: 'y' }],
      ['array containing null', [null]],
      ['missing a', [{ q: 'x' }]],
      ['a is null', [{ q: 'x', a: null }]],
      ['q is non-string number', [{ q: 1, a: 'y' }]],
      ['q is whitespace only', [{ q: '   ', a: 'y' }]],
      ['a is empty string', [{ q: 'x', a: '' }]],
    ])('throws when faq is %s', (_label, badFaq) => {
      expect(() =>
        parseArticleMeta({ ...baseFrontmatter, faq: badFaq }),
      ).toThrow();
    });

    it('error message includes slug and faq[i].field locator (i=1 case)', () => {
      expect(() =>
        parseArticleMeta({
          ...baseFrontmatter,
          slug: 'sample-slug',
          faq: [
            { q: 'good', a: 'fine' },
            { q: '', a: 'z' },
          ],
        }),
      ).toThrow(/sample-slug.*faq\[1\]\.q/);
    });
  });

  describe('invariant', () => {
    it('throws (not partial state) when any item is invalid', () => {
      let caught: unknown = null;
      try {
        parseArticleMeta({
          ...baseFrontmatter,
          faq: [
            { q: 'ok', a: 'ok' },
            { q: 'ok2', a: '' },
          ],
        });
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(Error);
    });

    it('does not mutate input objects', () => {
      const input = [{ q: 'Q', a: 'A' }];
      const snapshot = JSON.parse(JSON.stringify(input));
      parseArticleMeta({ ...baseFrontmatter, faq: input });
      expect(input).toEqual(snapshot);
    });
  });
});

describe('faqAnswerToPlainText', () => {
  describe('happy path', () => {
    it.each<[string, string]>([
      ['단순 문장', '단순 문장'],
      ['답은 **NIPT** 입니다.', '답은 NIPT 입니다.'],
      ['[보건복지부](https://example.com) 참고', '보건복지부 참고'],
    ])('%j -> %j', (input, expected) => {
      expect(faqAnswerToPlainText(input)).toBe(expected);
    });
  });

  describe('boundary', () => {
    it('empty string returns empty string', () => {
      expect(faqAnswerToPlainText('')).toBe('');
    });

    it('whitespace-only returns empty string after trim', () => {
      expect(faqAnswerToPlainText('\n\n')).toBe('');
    });

    it('paragraph breaks (\\n\\n) collapse to single space', () => {
      expect(faqAnswerToPlainText('여러\n\n단락')).toBe('여러 단락');
    });

    it('strips raw HTML tags entirely', () => {
      expect(faqAnswerToPlainText('hello <script>x</script> world')).toBe(
        'hello x world',
      );
    });
  });

  describe('invariant', () => {
    it('output never contains HTML tag characters', () => {
      const samples = [
        '**bold** [link](u)',
        'inline <b>tag</b>',
        '[보건복지부](https://example.com)',
        '단순',
      ];
      for (const s of samples) {
        expect(/<[^>]+>/.test(faqAnswerToPlainText(s))).toBe(false);
      }
    });

    it('idempotent: f(f(x)) === f(x)', () => {
      const samples = [
        '답은 **NIPT** 입니다.',
        '[보건복지부](https://example.com) 참고',
        '여러\n\n단락',
        '',
      ];
      for (const s of samples) {
        const once = faqAnswerToPlainText(s);
        expect(faqAnswerToPlainText(once)).toBe(once);
      }
    });
  });
});
