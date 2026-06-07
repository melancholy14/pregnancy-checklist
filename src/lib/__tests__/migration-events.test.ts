import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  recordMigration,
  flushPendingMigrationEvents,
  hasPendingMigrations,
  subscribeMigration,
  __resetPendingMigrationsForTest,
} from '../migration-events';

type GtagFn = (...args: unknown[]) => void;

function stubGtagOnWindow(): { gtag: ReturnType<typeof vi.fn> } {
  const gtag = vi.fn();
  // node 환경에서는 window 자체가 없음. sendGAEvent 가 `"gtag" in window` 를 보므로
  // window 객체를 통째로 stub 하고 gtag 키를 넣는다.
  vi.stubGlobal('window', { gtag: gtag as unknown as GtagFn });
  return { gtag };
}

function stubWindowWithoutGtag(): void {
  vi.stubGlobal('window', {});
}

beforeEach(() => {
  __resetPendingMigrationsForTest();
});

afterEach(() => {
  __resetPendingMigrationsForTest();
  vi.unstubAllGlobals();
});

describe('recordMigration / hasPendingMigrations', () => {
  it('빈 큐는 hasPending=false', () => {
    expect(hasPendingMigrations()).toBe(false);
  });

  it('record 후 hasPending=true', () => {
    recordMigration({
      store_name: 'checklist',
      from_version: 0,
      to_version: 1,
    });
    expect(hasPendingMigrations()).toBe(true);
  });
});

describe('flushPendingMigrationEvents', () => {
  it('happy path: success record 1건 → schema_migration_run 발사 + 큐 drain', () => {
    const { gtag } = stubGtagOnWindow();
    recordMigration({
      store_name: 'checklist',
      from_version: 0,
      to_version: 1,
    });

    const anyFailed = flushPendingMigrationEvents();

    expect(anyFailed).toBe(false);
    expect(gtag).toHaveBeenCalledWith('event', 'schema_migration_run', {
      store_name: 'checklist',
      from_version: 0,
      to_version: 1,
    });
    expect(hasPendingMigrations()).toBe(false);
  });

  it('failure record 1건 → schema_migration_failed + onFailedToast 호출 + 큐 drain', () => {
    const { gtag } = stubGtagOnWindow();
    const onFailedToast = vi.fn();
    recordMigration({
      store_name: 'checklist',
      failed: true,
      persisted_version: 999,
      current_version: 1,
    });

    const anyFailed = flushPendingMigrationEvents({ onFailedToast });

    expect(anyFailed).toBe(true);
    expect(gtag).toHaveBeenCalledWith('event', 'schema_migration_failed', {
      store_name: 'checklist',
      persisted_version: 999,
      current_version: 1,
    });
    expect(onFailedToast).toHaveBeenCalledTimes(1);
    expect(hasPendingMigrations()).toBe(false);
  });

  it('success + failure 동시 적재 → 두 이벤트 모두 발사 + toast 1회만', () => {
    const { gtag } = stubGtagOnWindow();
    const onFailedToast = vi.fn();
    recordMigration({ store_name: 'timeline', from_version: 0, to_version: 1 });
    recordMigration({
      store_name: 'checklist',
      failed: true,
      persisted_version: 999,
      current_version: 1,
    });
    recordMigration({
      store_name: 'weight',
      failed: true,
      persisted_version: 7,
      current_version: 1,
    });

    flushPendingMigrationEvents({ onFailedToast });

    expect(gtag).toHaveBeenCalledTimes(3);
    // 다발성 실패에도 toast 는 1회만 — 임산부 사용자 불안 자극 회피.
    expect(onFailedToast).toHaveBeenCalledTimes(1);
    expect(hasPendingMigrations()).toBe(false);
  });

  it('gtag 미로딩 시 큐를 보존 (no-op) — 다음 mount 에서 재시도 가능', () => {
    stubWindowWithoutGtag();
    const onFailedToast = vi.fn();
    recordMigration({
      store_name: 'due_date',
      failed: true,
      persisted_version: 42,
      current_version: 1,
    });

    const anyFailed = flushPendingMigrationEvents({ onFailedToast });

    expect(anyFailed).toBe(false);
    expect(onFailedToast).not.toHaveBeenCalled();
    expect(hasPendingMigrations()).toBe(true);
  });

  it('빈 큐 flush 는 no-op', () => {
    const { gtag } = stubGtagOnWindow();
    const onFailedToast = vi.fn();

    const anyFailed = flushPendingMigrationEvents({ onFailedToast });

    expect(anyFailed).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
    expect(onFailedToast).not.toHaveBeenCalled();
  });

  it('invariant: drain 후 같은 record 가 재발사되지 않는다 (idempotent flush)', () => {
    const { gtag } = stubGtagOnWindow();
    recordMigration({ store_name: 'weight', from_version: 0, to_version: 1 });

    flushPendingMigrationEvents();
    flushPendingMigrationEvents();
    flushPendingMigrationEvents();

    expect(gtag).toHaveBeenCalledTimes(1);
  });
});

describe('subscribeMigration', () => {
  it('record 호출 시 listener 알림', () => {
    const cb = vi.fn();
    subscribeMigration(cb);
    recordMigration({ store_name: 'checklist', from_version: 0, to_version: 1 });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('여러 listener 동시 알림', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    subscribeMigration(cb1);
    subscribeMigration(cb2);
    recordMigration({ store_name: 'weight', from_version: 0, to_version: 1 });
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  it('unsubscribe 후 알림 안 함', () => {
    const cb = vi.fn();
    const unsub = subscribeMigration(cb);
    unsub();
    recordMigration({ store_name: 'timeline', from_version: 0, to_version: 1 });
    expect(cb).not.toHaveBeenCalled();
  });

  it('subscribe 전에 적재된 record 는 listener 에 흘러오지 않지만, 이후 record 는 흘러옴', () => {
    recordMigration({ store_name: 'checklist', from_version: 0, to_version: 1 });
    const cb = vi.fn();
    subscribeMigration(cb);
    expect(cb).not.toHaveBeenCalled();
    recordMigration({ store_name: 'weight', from_version: 0, to_version: 1 });
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('PII 가드 — failure 페이로드는 store_name + version 만', () => {
  it('schema_migration_failed 파라미터에 사용자 식별 정보 부재', () => {
    const { gtag } = stubGtagOnWindow();
    recordMigration({
      store_name: 'checklist',
      failed: true,
      persisted_version: 12,
      current_version: 1,
    });
    flushPendingMigrationEvents();

    const callArgs = gtag.mock.calls[0];
    expect(callArgs[0]).toBe('event');
    expect(callArgs[1]).toBe('schema_migration_failed');
    const params = callArgs[2] as Record<string, unknown>;
    expect(Object.keys(params).sort()).toEqual([
      'current_version',
      'persisted_version',
      'store_name',
    ]);
  });
});
