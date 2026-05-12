"use client";

import { useCallback, useEffect, useRef } from "react";
import { sendGAEvent } from "@/lib/analytics";
import type { ChecklistItem } from "@/types/checklist";

const DEBOUNCE_MS = 200;

// catalog §3.B 주의: rapid toggle 시 디바운스로 최종 상태만 발사한다.
// 동일 item 재토글이 윈도우 안에 들어오면 이전 타이머를 취소하고 새 willCheck로 덮어쓴다.
export function useChecklistToggleEvent() {
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  return useCallback((item: ChecklistItem, willCheck: boolean) => {
    const timers = timersRef.current;
    const existing = timers.get(item.id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      sendGAEvent("checklist_item_toggle", {
        item_id: item.id,
        action: willCheck ? "check" : "uncheck",
        week: item.recommendedWeek,
        category: item.category,
        is_custom: item.isCustom ?? false,
      });
      timers.delete(item.id);
    }, DEBOUNCE_MS);
    timers.set(item.id, timer);
  }, []);
}
