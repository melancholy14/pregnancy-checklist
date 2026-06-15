import { describe, it, expect } from 'vitest';
import {
  getBreadcrumbForPath,
  BREADCRUMB_LABELS,
  type BreadcrumbItem,
} from '../breadcrumb-labels';
import { BASE_URL } from '../constants';

const abs = (path: string) => `${BASE_URL}${path}`;

describe('getBreadcrumbForPath', () => {
  describe('happy path — 정확 매치 라우트', () => {
    it('루트 / → position 1 단일 항목', () => {
      expect(getBreadcrumbForPath('/')).toEqual<BreadcrumbItem[]>([
        { position: 1, name: '홈', item: abs('/') },
      ]);
    });

    it('/checklist/hospital-bag → 3-level breadcrumb', () => {
      expect(getBreadcrumbForPath('/checklist/hospital-bag')).toEqual<BreadcrumbItem[]>([
        { position: 1, name: '홈', item: abs('/') },
        { position: 2, name: '체크리스트', item: abs('/checklist') },
        { position: 3, name: '출산가방 체크리스트', item: abs('/checklist/hospital-bag') },
      ]);
    });

    it('/articles/foo + articleMeta → 3-level (article title 사용)', () => {
      expect(
        getBreadcrumbForPath('/articles/foo', { title: '테스트 글', slug: 'foo' }),
      ).toEqual<BreadcrumbItem[]>([
        { position: 1, name: '홈', item: abs('/') },
        { position: 2, name: '정보 & 가이드', item: abs('/articles') },
        { position: 3, name: '테스트 글', item: abs('/articles/foo') },
      ]);
    });
  });

  describe('boundary — articleMeta·unknown route·정적/동적 충돌', () => {
    it('/articles/foo 인데 articleMeta 미주입 → 빈 배열 (JSON-LD 자체 생성 X)', () => {
      expect(getBreadcrumbForPath('/articles/foo')).toEqual([]);
    });

    it('등록되지 않은 라우트 → 빈 배열', () => {
      expect(getBreadcrumbForPath('/unknown-route')).toEqual([]);
    });

    it('/articles 는 정적 매치, /articles/[slug] 동적 패턴과 충돌하지 않음', () => {
      // /articles 는 articleMeta 없이도 정확 매치 라벨 사용
      expect(getBreadcrumbForPath('/articles')).toEqual<BreadcrumbItem[]>([
        { position: 1, name: '홈', item: abs('/') },
        { position: 2, name: '정보 & 가이드', item: abs('/articles') },
      ]);
    });
  });

  describe('priority — 정확 매치 우선, prefix 공유 라우트 분리', () => {
    it('/checklist 와 /checklist/hospital-bag 각각 다른 breadcrumb', () => {
      const hub = getBreadcrumbForPath('/checklist');
      const sub = getBreadcrumbForPath('/checklist/hospital-bag');

      expect(hub).toHaveLength(2);
      expect(hub[hub.length - 1]).toEqual({
        position: 2,
        name: '체크리스트',
        item: abs('/checklist'),
      });
      expect(sub).toHaveLength(3);
      expect(sub[sub.length - 1]).toEqual({
        position: 3,
        name: '출산가방 체크리스트',
        item: abs('/checklist/hospital-bag'),
      });
    });
  });

  describe('invariant — position 연속·item 절대 URL', () => {
    it.each(
      Object.keys(BREADCRUMB_LABELS).filter((p) => p !== '/') as string[],
    )('%s: position 1..N 연속, item 모두 BASE_URL 시작', (pathname) => {
      const items = getBreadcrumbForPath(pathname);
      expect(items.length).toBeGreaterThan(0);
      items.forEach((it, idx) => {
        expect(it.position).toBe(idx + 1);
        expect(it.item.startsWith(BASE_URL)).toBe(true);
      });
    });

    it('article 동적 라우트도 position 1..3 연속, item 절대 URL', () => {
      const items = getBreadcrumbForPath('/articles/bar', { title: '글', slug: 'bar' });
      expect(items.map((i) => i.position)).toEqual([1, 2, 3]);
      items.forEach((i) => expect(i.item.startsWith(BASE_URL)).toBe(true));
    });
  });
});
