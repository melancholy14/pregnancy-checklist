import { describe, it, expect } from 'vitest';
import { validateSchema } from '../prompt-shared.js';
import type { IsoWeek } from '../types.js';

// qa.md §3.2 의 validateSchema 매트릭스.
// Wave 2 추가분: §6/§7 필수 헤더, placeholder 검출, sentinel 화이트리스트, 신규 섹션 빈 표 룰.

const WEEK_22 = '2026-W22' as IsoWeek;
const WEEK_21 = '2026-W21' as IsoWeek;

function makeValidReport(opts: {
  week?: IsoWeek;
  section6Body?: string;
  section7Body?: string;
} = {}): string {
  const week = opts.week ?? WEEK_22;
  const section6Body = opts.section6Body ?? '| Organic Search | 12 |';
  const section7Body = opts.section7Body ?? '| /article/foo | 8 |';
  return [
    '---',
    `week: ${week}`,
    'generated: 2026-06-01T00:00:00.000Z',
    'ga4_property: 000000000',
    '---',
    '',
    `# Weekly Report — ${week}`,
    '',
    '## TL;DR',
    '- 지난 주 대비 변동 없음.',
    '',
    '## 1. 북극성 — 코호트 리텐션',
    '| cohort_join_week | W+1 | W+4 |',
    '| 2026-W14 | 1 | 0 |',
    '**해석**: 신규 cohort 1명.',
    '',
    '## 2. 핵심 행동 도달률',
    '- 체크 토글: 100% (+10%)',
    '- 글 완독: (신규)',
    '- 체중 입력: (데이터 없음)',
    '',
    '## 3. 다음 콘텐츠 백로그 (search_submit, results_count=0)',
    '1. "임신 입덧" — 3건',
    '',
    '## 4. 자체화 후보 (external_link_click TOP)',
    '1. example.gov.kr — 2건 (자체화 후보)',
    '',
    '## 5. 이상치 / 마찰점',
    '- page_view: +128% (incident) — 모집단 작음, 추정',
    '',
    '## 6. 유입 채널 (sessionDefaultChannelGroup TOP)',
    section6Body,
    '',
    '## 7. 랜딩 페이지 (landingPagePlusQueryString TOP)',
    section7Body,
    '',
    '## 8. 추천 액션',
    '- [ ] 액션 1 (근거: §5)',
    '',
  ].join('\n');
}

describe('validateSchema', () => {
  describe('happy path', () => {
    it('frontmatter + 9 섹션(TL;DR + §1~§8) 모두 있는 정상 markdown → valid', () => {
      const result = validateSchema(makeValidReport(), WEEK_22);
      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    });
  });

  describe('boundary — frontmatter', () => {
    it('frontmatter 자체가 없으면 delimiters + week 둘 다 issue', () => {
      const md = makeValidReport().replace(/^---[\s\S]+?---\n\n/, '');
      const result = validateSchema(md, WEEK_22);
      expect(result.valid).toBe(false);
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.stringContaining('frontmatter delimiters missing'),
          expect.stringContaining('week: 2026-W22'),
        ]),
      );
    });

    it('week 라벨 불일치 (W22 입력에 W21 markdown) → "week missing" issue', () => {
      const md = makeValidReport({ week: WEEK_21 });
      const result = validateSchema(md, WEEK_22);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('frontmatter "week: 2026-W22" missing');
    });
  });

  describe('boundary — REQUIRED_HEADERS (Wave 2 추가분)', () => {
    it.each([
      ['## 6. 유입 채널', '## 6. 유입 채널 누락'],
      ['## 7. 랜딩 페이지', '## 7. 랜딩 페이지 누락'],
      ['## 8. 추천 액션', '## 8. 추천 액션 누락'],
    ])('%s 누락 → issue', (header) => {
      // 헤더만 끊어내고 본문은 두면 인접 섹션이 합쳐져 본문 형태가 비정상이 되므로,
      // 본문까지 같이 제거해야 의도한 "섹션 자체 부재" 케이스가 된다.
      const md = makeValidReport().replace(
        new RegExp(`${header}[\\s\\S]*?(?=\\n## |$)`),
        '',
      );
      const result = validateSchema(md, WEEK_22);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain(`section "${header}" missing`);
    });
  });

  describe('priority — placeholder vs sentinel', () => {
    it('`| ... | ... |` 행이 본문에 남으면 invalid + placeholder issue', () => {
      const md = makeValidReport({
        section6Body: '| ... | ... |',
      });
      const result = validateSchema(md, WEEK_22);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.includes('placeholder leak'))).toBe(true);
    });

    it('`(신규)` sentinel 만 있는 행은 placeholder 검출에서 제외 → valid', () => {
      // 본문 어딘가 `| ... |` 패턴이 없는 일반 markdown 에 sentinel 등장 가능.
      const md = makeValidReport().replace(
        '- 글 완독: (신규)',
        '- 글 완독: (신규) — wowDelta: "new"',
      );
      const result = validateSchema(md, WEEK_22);
      expect(result.valid).toBe(true);
    });

    it('한 라인에 placeholder + sentinel 동시 → 그 라인은 sentinel 화이트리스트 (다른 placeholder 라인 없으면 valid)', () => {
      const md = makeValidReport({
        section6Body: '| ... | (신규) |',
      });
      // 단 §6 본문이 `(데이터 없음)` 도 아니고 데이터 행도 placeholder 인 셈이라
      // 신규 섹션 빈 표 룰에 걸린다(데이터 행 없음). placeholder 자체는 sentinel 로 제외됐는지 검증.
      const result = validateSchema(md, WEEK_22);
      const placeholderIssues = result.issues.filter((i) => i.includes('placeholder leak'));
      expect(placeholderIssues).toEqual([]);
    });

    it('다른 라인 placeholder + sentinel 라인 동시 → placeholder 우선 → invalid', () => {
      // §7 에 sentinel 라인, §6 에 placeholder 라인.
      const md = makeValidReport({
        section6Body: '| ... | ... |',
        section7Body: '| /article/(신규) | 1 |',
      });
      const result = validateSchema(md, WEEK_22);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.includes('placeholder leak'))).toBe(true);
    });
  });

  describe('priority — 신규 섹션 빈 표 허용 (시나리오 7, 결정 3 옵션 A)', () => {
    it('§6 본문 = `(데이터 없음)` 단일 줄 → valid', () => {
      const md = makeValidReport({ section6Body: '(데이터 없음)' });
      const result = validateSchema(md, WEEK_22);
      expect(result.valid).toBe(true);
    });

    it('§7 본문 = `(데이터 없음)` 단일 줄 → valid', () => {
      const md = makeValidReport({ section7Body: '(데이터 없음)' });
      const result = validateSchema(md, WEEK_22);
      expect(result.valid).toBe(true);
    });

    it('§6 본문 = placeholder 만 (데이터 행 없음, "(데이터 없음)" 명시 없음) → invalid', () => {
      const md = makeValidReport({ section6Body: '| ... | ... |' });
      const result = validateSchema(md, WEEK_22);
      expect(result.valid).toBe(false);
    });

    it('§6 본문 = 빈 줄만 (헤더만 + body empty) → invalid', () => {
      const md = makeValidReport({ section6Body: '' });
      const result = validateSchema(md, WEEK_22);
      expect(result.valid).toBe(false);
      // 헤더 부속 텍스트(`(sessionDefaultChannelGroup TOP)`)는 본문이 아니라 데이터 행 없음으로 떨어진다.
      expect(
        result.issues.some(
          (i) => i.includes('## 6. 유입 채널') && (i.includes('no data row') || i.includes('empty body')),
        ),
      ).toBe(true);
    });
  });

  describe('invariant — issues 누적', () => {
    it('여러 문제 동시 발생 시 모두 누적 (한 issue 만 잡고 종료 X)', () => {
      // week 불일치 + §8 헤더 누락 + §6 placeholder 동시 발생.
      let md = makeValidReport({
        week: WEEK_21,
        section6Body: '| ... | ... |',
      });
      md = md.replace(/## 8\. 추천 액션[\s\S]*$/, '');
      const result = validateSchema(md, WEEK_22);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThanOrEqual(3);
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.stringContaining('week: 2026-W22'),
          expect.stringContaining('## 8. 추천 액션'),
          expect.stringContaining('placeholder leak'),
        ]),
      );
    });
  });
});
