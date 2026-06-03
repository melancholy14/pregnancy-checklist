import { describe, it, expect } from 'vitest';
import { pathToTab } from '../analytics';

describe('pathToTab', () => {
  describe('happy path — 5탭 정확 매칭', () => {
    it.each([
      ['/', 'home'],
      ['/checklist', 'checklist'],
      ['/weight', 'weight'],
      ['/baby-fair', 'baby-fair'],
      ['/articles', 'info'],
    ] as const)('%s -> %s', (pathname, expected) => {
      expect(pathToTab(pathname)).toBe(expected);
    });
  });

  describe('boundary — prefix 매칭 + 슬래시 변종', () => {
    it.each([
      ['/checklist/hospital-bag', 'checklist'],
      ['/checklist/partner-prep', 'checklist'],
      ['/weight/', 'weight'],
      ['/articles/pregnancy-sleep-positions-guide', 'info'],
    ] as const)('%s -> %s', (pathname, expected) => {
      expect(pathToTab(pathname)).toBe(expected);
    });
  });

  describe('alsoMatchPrefixes — /info 도 info 탭', () => {
    // BottomNav.tsx 의 alsoMatchPrefixes: ["/info"] 정합.
    // /info 라우트는 phase-4.6 §1 에서 /articles 로 meta-refresh redirect 되지만,
    // 라우트 도달 직후 GA4 발화 시점은 /info 인 경우가 있어 같은 탭으로 분류.
    it.each([
      ['/info', 'info'],
      ['/info/', 'info'],
      ['/info/anything', 'info'],
    ] as const)('%s -> info', (pathname, expected) => {
      expect(pathToTab(pathname)).toBe(expected);
    });
  });

  describe('null — 5탭 매핑 외 경로는 axis_enter 발사 안 함', () => {
    it.each([
      ['/timeline'],          // T1 rollback 으로 살아있지만 5탭 외
      ['/timeline/32'],
      ['/guides/hospital-bag'],
      ['/about'],
      ['/privacy'],
      ['/contact'],
      ['/videos'],            // V1=A 후 meta-refresh redirect 페이지
      ['/checklistx'],        // checklist prefix-with-no-slash, 매칭 X
      ['/baby-fair/extra'],   // baby-fair 는 exact match
      [''],                   // 빈 문자열
      ['/unknown'],
    ] as const)('%s -> null', (pathname) => {
      expect(pathToTab(pathname)).toBeNull();
    });
  });

  describe('invariant — 반환값은 5탭 enum 또는 null', () => {
    const VALID_TABS = new Set(['home', 'checklist', 'weight', 'baby-fair', 'info']);

    it.each([
      '/',
      '/checklist',
      '/checklist/hospital-bag',
      '/weight',
      '/weight/log',
      '/baby-fair',
      '/articles',
      '/articles/pregnancy-sleep-positions-guide',
      '/info',
      '/info/foo',
      '/timeline',
      '/about',
      '',
    ])('pathToTab(%s) 결과는 5탭 enum 또는 null', (pathname) => {
      const result = pathToTab(pathname);
      expect(result === null || VALID_TABS.has(result)).toBe(true);
    });

    it('/articles 와 /info 는 동일한 탭으로 매핑 (alsoMatchPrefixes 정합)', () => {
      expect(pathToTab('/articles')).toBe(pathToTab('/info'));
    });
  });
});
