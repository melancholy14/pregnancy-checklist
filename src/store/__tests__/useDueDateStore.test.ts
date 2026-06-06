import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  migrateDueDateStorage,
  DUE_DATE_STORE_VERSION,
} from '../useDueDateStore';
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

// 결정적 today — KST 기준 2026-06-06 정오 (UTC 03:00).
const FIXED_TODAY = new Date('2026-06-06T03:00:00Z');

beforeEach(() => {
  __resetPendingMigrationsForTest();
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_TODAY);
});

afterEach(() => {
  __resetPendingMigrationsForTest();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('migrateDueDateStorage — happy path (v0 → v1)', () => {
  it('dueDate 보유 v0 → currentPregnancyWeek 계산 + record', () => {
    // FIXED_TODAY=2026-06-06 (KST). dueDate=2026-08-13 → 약 31~32주 부근.
    const result = migrateDueDateStorage({ dueDate: '2026-08-13' }, 0);

    expect(result.dueDate).toBe('2026-08-13');
    expect(typeof result.currentPregnancyWeek).toBe('number');
    expect(result.currentPregnancyWeek).toBeGreaterThan(0);
    expect(result.currentPregnancyWeek).toBeLessThan(43);
    expect(result.lastCalcDate).toBe('2026-06-06');
    expect(result.cohortJoinWeek).toBe(result.currentPregnancyWeek);

    const calls = captureGtagCalls();
    flushPendingMigrationEvents();
    expect(calls[0][1]).toBe('schema_migration_run');
    expect(calls[0][2]).toEqual({
      store_name: 'due_date',
      from_version: 0,
      to_version: 1,
    });
  });

  it('dueDate 없는 v0 → 빈 default state + record', () => {
    const result = migrateDueDateStorage({}, 0);

    expect(result).toEqual({
      dueDate: null,
      currentPregnancyWeek: null,
      lastCalcDate: null,
      cohortJoinWeek: null,
    });
    expect(hasPendingMigrations()).toBe(true);
  });

  it.each([null, undefined] as const)('persistedState=%s → 빈 default state', (input) => {
    const result = migrateDueDateStorage(input, 0);
    expect(result).toEqual({
      dueDate: null,
      currentPregnancyWeek: null,
      lastCalcDate: null,
      cohortJoinWeek: null,
    });
  });

  it('current version → passthrough, record 없음', () => {
    const v1 = {
      dueDate: '2026-08-13',
      currentPregnancyWeek: 30,
      lastCalcDate: '2026-06-06',
      cohortJoinWeek: 30,
    };

    const result = migrateDueDateStorage(v1, DUE_DATE_STORE_VERSION);

    expect(result).toEqual(v1);
    expect(hasPendingMigrations()).toBe(false);
  });
});

describe('migrateDueDateStorage — unknown version', () => {
  it('throw + schema_migration_failed record', () => {
    expect(() => migrateDueDateStorage({}, 42)).toThrowError(/Unknown due-date storage version/);

    const calls = captureGtagCalls();
    flushPendingMigrationEvents();
    expect(calls[0][1]).toBe('schema_migration_failed');
    expect(calls[0][2]).toEqual({
      store_name: 'due_date',
      persisted_version: 42,
      current_version: 1,
    });
  });
});
