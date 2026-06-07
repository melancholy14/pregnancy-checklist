"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import {
  flushPendingMigrationEvents,
  hasPendingMigrations,
  subscribeMigration,
} from "@/lib/migration-events";

const RETRY_INTERVAL_MS = 200;
const MAX_WAIT_MS = 5000;

export function MigrationFlushClient() {
  useEffect(() => {
    let cancelled = false;
    let scheduled: number | null = null;

    const showFailureToast = () => {
      toast("체크리스트 데이터를 정리했어요. 일부 설정이 초기값으로 돌아갔을 수 있어요.", {
        duration: 4000,
      });
    };

    const tryFlush = (deadline: number) => {
      if (cancelled) return;
      if (!hasPendingMigrations()) return;
      if (typeof window === "undefined") return;
      if (!("gtag" in window)) {
        if (Date.now() > deadline) return;
        scheduled = window.setTimeout(() => tryFlush(deadline), RETRY_INTERVAL_MS);
        return;
      }
      flushPendingMigrationEvents({ onFailedToast: showFailureToast });
    };

    // 1. mount 시점 즉시 시도 — 첫 페이지 import 로 이미 큐에 들어온 record 처리.
    tryFlush(Date.now() + MAX_WAIT_MS);

    // 2. 이후 record 도 즉시 잡기 — 클라이언트 네비게이션 후 import 된 store 의 migrate 알림.
    const unsubscribe = subscribeMigration(() => {
      tryFlush(Date.now() + MAX_WAIT_MS);
    });

    return () => {
      cancelled = true;
      if (scheduled !== null) window.clearTimeout(scheduled);
      unsubscribe();
    };
  }, []);

  return null;
}
