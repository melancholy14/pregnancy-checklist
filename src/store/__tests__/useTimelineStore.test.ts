import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  migrateTimelineStorage,
  TIMELINE_STORE_VERSION,
} from '../useTimelineStore';
import type { TimelineItem } from '@/types/timeline';
import {
  __resetPendingMigrationsForTest,
  hasPendingMigrations,
  flushPendingMigrationEvents,
} from '@/lib/migration-events';

function captureGtagCalls(): Array<[string, string, Record<string, unknown>]> {
  const calls: Array<[string, string, Record<string, unknown>]> = [];
  vi.stubGlobal('window', {
    gtag: (...args: unknown[]) => {
      calls.push(args as [string, string, Record<string, unknown>]);
    },
  });
  return calls;
}

const SAMPLE_ITEM: TimelineItem = {
  id: 't1',
  week: 20,
  title: '정밀초음파',
  description: '20주 검사',
  type: 'admin',
  priority: 'high',
  isCustom: true,
};

beforeEach(() => {
  __resetPendingMigrationsForTest();
});

afterEach(() => {
  __resetPendingMigrationsForTest();
  vi.unstubAllGlobals();
});

describe('migrateTimelineStorage — happy path', () => {
  it('v0 데이터 → identity 반환 + schema_migration_run record', () => {
    const result = migrateTimelineStorage({ customItems: [SAMPLE_ITEM] }, 0);

    expect(result.customItems).toEqual([SAMPLE_ITEM]);

    const calls = captureGtagCalls();
    flushPendingMigrationEvents();
    expect(calls[0][1]).toBe('schema_migration_run');
    expect(calls[0][2]).toEqual({
      store_name: 'timeline',
      from_version: 0,
      to_version: 1,
    });
  });

  it('current version → record 없이 동일 shape', () => {
    const v1 = { customItems: [SAMPLE_ITEM] };

    const result = migrateTimelineStorage(v1, TIMELINE_STORE_VERSION);

    expect(result).toEqual(v1);
    expect(hasPendingMigrations()).toBe(false);
  });
});

describe('migrateTimelineStorage — boundary', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['{}', {}],
    ['customItems missing', { other: 'x' }],
  ] as const)('%s → 빈 customItems 배열', (_label, input) => {
    const result = migrateTimelineStorage(input, 0);
    expect(result.customItems).toEqual([]);
  });

  it('customItems가 array 아님 → 빈 배열', () => {
    const result = migrateTimelineStorage({ customItems: 'broken' }, 0);
    expect(result.customItems).toEqual([]);
  });
});

describe('migrateTimelineStorage — unknown version', () => {
  it('throw + schema_migration_failed record', () => {
    expect(() => migrateTimelineStorage({}, 999)).toThrowError(/Unknown timeline storage version/);

    const calls = captureGtagCalls();
    flushPendingMigrationEvents();
    expect(calls[0][1]).toBe('schema_migration_failed');
    expect(calls[0][2]).toEqual({
      store_name: 'timeline',
      persisted_version: 999,
      current_version: 1,
    });
  });
});
