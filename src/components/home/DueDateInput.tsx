"use client";

import { useId, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight, CalendarDays, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useDueDateStore } from "@/store/useDueDateStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sendGAEvent } from "@/lib/analytics";
import { parseDateKST, getTodayKST } from "@/lib/date-kst";

export function DueDateInput() {
  const { dueDate, currentPregnancyWeek, setDueDate } = useDueDateStore();
  const hydrated = useSyncExternalStore(
    (cb) => useDueDateStore.persist.onFinishHydration(cb),
    () => useDueDateStore.persist.hasHydrated(),
    () => false
  );
  const inputId = useId();
  const [editMode, setEditMode] = useState(false);
  const [draftDate, setDraftDate] = useState("");

  const daysLeft = useMemo(() => {
    if (!hydrated || !dueDate) return null;
    const diff = Math.ceil(
      (parseDateKST(dueDate).getTime() - parseDateKST(getTodayKST()).getTime()) /
        86400000
    );
    return Math.max(0, diff);
  }, [hydrated, dueDate]);

  const showInfoMode = hydrated && dueDate && !editMode;

  const handleSubmit = () => {
    if (!draftDate) return;
    const wasUpdate = dueDate !== null;
    const ok = setDueDate(draftDate);
    if (!ok) {
      toast.error("출산 예정일을 다시 확인해주세요", {
        description: "오늘 이후 ~ 40주 이내 날짜를 입력해주세요",
        duration: 4000,
      });
      setDraftDate("");
      return;
    }
    const week = useDueDateStore.getState().currentPregnancyWeek;
    if (week !== null) {
      sendGAEvent("due_date_set", { pregnancy_week: week });
      sendGAEvent("pregnancy_week_set", {
        week,
        source: wasUpdate ? "manual_update" : "onboarding",
      });
    }
    setEditMode(false);
    setDraftDate("");
  };

  const handleEdit = () => {
    setDraftDate(dueDate ?? "");
    setEditMode(true);
  };

  if (!hydrated) {
    return (
      <Card className="rounded-2xl shadow-md border border-black/4 bg-pastel-lavender/40">
        <CardContent className="p-5 min-h-[180px]" aria-hidden />
      </Card>
    );
  }

  if (showInfoMode) {
    return (
      <Card className="rounded-2xl shadow-md border border-black/4 bg-pastel-peach/40">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={20} className="text-foreground shrink-0" aria-hidden />
              <h2 className="text-base font-medium">
                현재 <strong>{currentPregnancyWeek}주차</strong>
                {daysLeft !== null && (
                  <span className="text-muted-foreground"> · D-{daysLeft}</span>
                )}
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 rounded-lg text-sm gap-1"
              onClick={handleEdit}
              aria-label="예정일 수정"
            >
              <Pencil size={14} aria-hidden />
              수정
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            출산 예정일: {dueDate}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl shadow-md border border-black/4 bg-pastel-lavender/40">
      <CardContent className="p-5">
        <h2 className="text-base font-medium mb-2 flex items-center gap-2">
          <CalendarDays size={20} className="text-foreground shrink-0" aria-hidden />
          예정일을 알려주세요
        </h2>
        <p className="text-sm text-foreground/80 mb-4" style={{ wordBreak: "keep-all" }}>
          예정일을 입력하면 주차별 체크리스트와 D-day로 정렬된 정보를 볼 수 있어요
        </p>
        <label htmlFor={inputId} className="sr-only">
          출산 예정일 선택
        </label>
        <input
          id={inputId}
          type="date"
          value={draftDate}
          onChange={(e) => setDraftDate(e.target.value)}
          className="w-full px-4 py-3 mb-3 bg-input-background rounded-xl border border-black/6 text-center focus:outline-none focus:ring-2 focus:ring-pastel-pink/50 transition-shadow"
        />
        <Button
          onClick={handleSubmit}
          disabled={!draftDate}
          className="w-full h-11 rounded-xl bg-pastel-pink/60 text-foreground hover:bg-pastel-pink disabled:opacity-40 gap-2"
          aria-label="예정일 저장"
        >
          예정일 저장
          <ArrowRight size={16} aria-hidden />
        </Button>
      </CardContent>
    </Card>
  );
}
