import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  migrateChecklistStorage,
  CHECKLIST_STORE_VERSION,
} from '../createChecklistStore';
import {
  __resetPendingMigrationsForTest,
  hasPendingMigrations,
  flushPendingMigrationEvents,
} from '@/lib/migration-events';

type GtagCall = [event: 'event', name: string, params: Record<string, unknown>];

function captureGtagCalls(): GtagCall[] {
  const calls: GtagCall[] = [];
  vi.stubGlobal('window', {
    gtag: (...args: unknown[]) => {
      calls.push(args as GtagCall);
    },
  });
  return calls;
}

beforeEach(() => {
  __resetPendingMigrationsForTest();
});

afterEach(() => {
  __resetPendingMigrationsForTest();
  vi.unstubAllGlobals();
});

describe('migrateChecklistStorage — happy path (v0 → v1 identity)', () => {
  it('정상 v0 데이터 → 동일 구조 반환 + schema_migration_run record', () => {
    const v0 = {
      checkedIds: ['a', 'b'],
      customItems: [
        {
          id: 'custom-1',
          title: '병원 예약',
          category: 'hospital',
          categoryName: '병원 준비',
          recommendedWeek: 0,
          priority: 'high',
          isCustom: true,
        },
      ],
    };

    const result = migrateChecklistStorage(v0, 0);

    expect(result.checkedIds).toEqual(['a', 'b']);
    expect(result.customItems).toHaveLength(1);
    expect(result.customItems[0].title).toBe('병원 예약');
    expect(result.customItems[0].priority).toBe('high');

    const calls = captureGtagCalls();
    flushPendingMigrationEvents();
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toBe('schema_migration_run');
    expect(calls[0][2]).toEqual({
      store_name: 'checklist',
      from_version: 0,
      to_version: 1,
    });
  });

  it('current version (1) 호출 → record 없이 동일 shape 반환', () => {
    const v1 = {
      checkedIds: ['x'],
      customItems: [
        {
          id: 'custom-1',
          title: 't',
          category: 'admin',
          categoryName: '행정',
          recommendedWeek: 0,
          priority: 'medium',
          isCustom: true,
        },
      ],
    };

    const result = migrateChecklistStorage(v1, CHECKLIST_STORE_VERSION);

    expect(result).toEqual(v1);
    expect(hasPendingMigrations()).toBe(false);
  });
});

describe('migrateChecklistStorage — boundary', () => {
  it.each([
    ['null persistedState', null],
    ['undefined persistedState', undefined],
    ['빈 객체', {}],
  ] as const)('%s → 빈 default state', (_label, input) => {
    const result = migrateChecklistStorage(input, 0);
    expect(result.checkedIds).toEqual([]);
    expect(result.customItems).toEqual([]);
  });

  it('빈 v0 데이터 → 빈 v1 state + 여전히 record (스토어 진입 신호)', () => {
    migrateChecklistStorage({ checkedIds: [], customItems: [] }, 0);
    expect(hasPendingMigrations()).toBe(true);
  });

  it('customItems 가 array 아님 → 빈 배열로 정규화', () => {
    const result = migrateChecklistStorage(
      { checkedIds: ['z'], customItems: 'broken' as unknown },
      0
    );
    expect(result.customItems).toEqual([]);
    expect(result.checkedIds).toEqual(['z']);
  });
});

describe('migrateChecklistStorage — 손상 item drop (title/category/id)', () => {
  function makeItem(overrides: Record<string, unknown>) {
    return {
      id: 'custom-x',
      title: '제목',
      category: 'admin',
      categoryName: '행정',
      recommendedWeek: 0,
      priority: 'medium',
      isCustom: true,
      ...overrides,
    };
  }

  it.each([
    ['title 빈 문자열', { title: '' }],
    ['title 공백만', { title: '   ' }],
    ['title null', { title: null }],
    ['title 누락', { title: undefined }],
    ['title 숫자형', { title: 42 }],
    ['id 빈 문자열', { id: '' }],
    ['id 누락', { id: undefined }],
    ['category 미지 enum', { category: 'totally_made_up' }],
    ['category null', { category: null }],
    ['category 누락', { category: undefined }],
  ] as const)('손상 케이스 %s → 그 item drop', (_label, overrides) => {
    const v0 = {
      checkedIds: [],
      customItems: [makeItem(overrides), makeItem({ id: 'custom-ok' })],
    };
    const result = migrateChecklistStorage(v0, 0);
    expect(result.customItems).toHaveLength(1);
    expect(result.customItems[0].id).toBe('custom-ok');
  });

  it('손상 + 정상 혼합 → 정상만 남고 순서 보존', () => {
    const v0 = {
      checkedIds: [],
      customItems: [
        makeItem({ id: 'a' }),
        makeItem({ id: 'b', title: '' }),
        makeItem({ id: 'c' }),
        makeItem({ id: 'd', category: 'unknown' }),
        makeItem({ id: 'e' }),
      ],
    };
    const result = migrateChecklistStorage(v0, 0);
    expect(result.customItems.map((i) => i.id)).toEqual(['a', 'c', 'e']);
  });
});

describe('migrateChecklistStorage — priority enum invariant', () => {
  it.each([
    ['high', 'high'],
    ['medium', 'medium'],
    ['low', 'low'],
    ['urgent', 'medium'], // 미지의 priority → silent normalize (spec §4 edge)
    [undefined, 'medium'],
    [null, 'medium'],
    ['', 'medium'],
  ] as const)('priority=%s → %s', (input, expected) => {
    const v0 = {
      checkedIds: [],
      customItems: [
        {
          id: 'x',
          title: 't',
          category: 'admin',
          categoryName: '행정',
          recommendedWeek: 0,
          priority: input as unknown,
          isCustom: true,
        },
      ],
    };

    const result = migrateChecklistStorage(v0, 0);

    expect(result.customItems[0].priority).toBe(expected);
  });
});

describe('migrateChecklistStorage — unknown version (failure)', () => {
  it('미지의 버전 → throw + failure record', () => {
    expect(() => migrateChecklistStorage({}, 999)).toThrowError(/Unknown checklist storage version/);

    const calls = captureGtagCalls();
    flushPendingMigrationEvents();
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toBe('schema_migration_failed');
    expect(calls[0][2]).toEqual({
      store_name: 'checklist',
      persisted_version: 999,
      current_version: 1,
    });
  });

  it('throw 후에도 큐는 1건만 (중복 적재 X)', () => {
    expect(() => migrateChecklistStorage({}, 7)).toThrow();
    expect(hasPendingMigrations()).toBe(true);
    // flush 후 큐는 비고, 같은 호출을 다시 하지 않는 한 추가 record 없음.
    const calls = captureGtagCalls();
    flushPendingMigrationEvents();
    expect(calls).toHaveLength(1);
  });
});

describe('migrateChecklistStorage — round-trip 불변식', () => {
  it('migrate 결과는 JSON 직렬화·역직렬화 후에도 동일 (persist 호환)', () => {
    const v0 = {
      checkedIds: ['a'],
      customItems: [
        {
          id: 'c1',
          title: 'test',
          category: 'admin',
          categoryName: '행정',
          recommendedWeek: 12,
          priority: 'low',
          isCustom: true,
          note: '메모',
        },
      ],
    };

    const migrated = migrateChecklistStorage(v0, 0);
    const roundTripped = JSON.parse(JSON.stringify(migrated));

    expect(roundTripped).toEqual(migrated);
  });
});
