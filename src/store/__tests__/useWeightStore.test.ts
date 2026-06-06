import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  migrateWeightStorage,
  WEIGHT_STORE_VERSION,
  type WeightLog,
} from '../useWeightStore';
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

const SAMPLE_LOG: WeightLog = { id: 'w1', date: '2026-03-01', weight: 60.5 };

beforeEach(() => {
  __resetPendingMigrationsForTest();
});

afterEach(() => {
  __resetPendingMigrationsForTest();
  vi.unstubAllGlobals();
});

describe('migrateWeightStorage — happy path', () => {
  it('v0 데이터 → identity 반환 + schema_migration_run record', () => {
    const result = migrateWeightStorage({ logs: [SAMPLE_LOG] }, 0);

    expect(result.logs).toEqual([SAMPLE_LOG]);

    const calls = captureGtagCalls();
    flushPendingMigrationEvents();
    expect(calls[0][1]).toBe('schema_migration_run');
    expect(calls[0][2]).toEqual({
      store_name: 'weight',
      from_version: 0,
      to_version: 1,
    });
  });

  it('current version → record 없이 동일 shape', () => {
    const v1 = { logs: [SAMPLE_LOG] };

    const result = migrateWeightStorage(v1, WEIGHT_STORE_VERSION);

    expect(result).toEqual(v1);
    expect(hasPendingMigrations()).toBe(false);
  });
});

describe('migrateWeightStorage — boundary', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['{}', {}],
  ] as const)('%s → 빈 logs 배열', (_label, input) => {
    const result = migrateWeightStorage(input, 0);
    expect(result.logs).toEqual([]);
  });
});

describe('migrateWeightStorage — unknown version', () => {
  it('throw + schema_migration_failed record', () => {
    expect(() => migrateWeightStorage({}, 99)).toThrowError(/Unknown weight storage version/);

    const calls = captureGtagCalls();
    flushPendingMigrationEvents();
    expect(calls[0][1]).toBe('schema_migration_failed');
    expect(calls[0][2]).toEqual({
      store_name: 'weight',
      persisted_version: 99,
      current_version: 1,
    });
  });
});
