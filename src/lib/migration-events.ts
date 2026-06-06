import { sendGAEvent } from "./analytics";

export type MigrationStoreName = "due_date" | "checklist" | "timeline" | "weight";

export interface MigrationSuccessRecord {
  store_name: MigrationStoreName;
  from_version: number;
  to_version: number;
  failed?: false;
}

export interface MigrationFailureRecord {
  store_name: MigrationStoreName;
  failed: true;
  persisted_version: number;
  current_version: number;
}

export type MigrationRecord = MigrationSuccessRecord | MigrationFailureRecord;

const pending: MigrationRecord[] = [];
const listeners: Array<() => void> = [];

export function recordMigration(record: MigrationRecord): void {
  pending.push(record);
  // 큐에 새 record 추가 알림 — MigrationFlushClient 처럼 늦게 mount 된 listener 가
  // 클라이언트 네비게이션 이후 import 된 store 의 migrate 도 즉시 flush 할 수 있게.
  for (const cb of listeners) {
    cb();
  }
}

export function hasPendingMigrations(): boolean {
  return pending.length > 0;
}

/**
 * 큐에 record 가 추가될 때마다 호출되는 listener 를 등록한다.
 * 반환값은 unsubscribe 함수 — 컴포넌트 unmount 시 정리.
 */
export function subscribeMigration(cb: () => void): () => void {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export interface FlushOptions {
  onFailedToast?: () => void;
}

/**
 * Drain queued migration events to GA4. Returns true if a failed migration was
 * recorded — caller may use this to trigger UX side-effects (toast). When gtag
 * is not yet available this is a no-op safe call: events remain in the queue.
 */
export function flushPendingMigrationEvents(options: FlushOptions = {}): boolean {
  if (pending.length === 0) return false;
  if (typeof window === "undefined") return false;
  if (!("gtag" in window)) return false;

  let anyFailed = false;
  const drained = pending.splice(0, pending.length);
  for (const record of drained) {
    if (record.failed) {
      anyFailed = true;
      sendGAEvent("schema_migration_failed", {
        store_name: record.store_name,
        persisted_version: record.persisted_version,
        current_version: record.current_version,
      });
    } else {
      sendGAEvent("schema_migration_run", {
        store_name: record.store_name,
        from_version: record.from_version,
        to_version: record.to_version,
      });
    }
  }
  if (anyFailed && options.onFailedToast) {
    options.onFailedToast();
  }
  return anyFailed;
}

// 테스트용: 큐 초기화 + listener 초기화.
export function __resetPendingMigrationsForTest(): void {
  pending.length = 0;
  listeners.length = 0;
}
