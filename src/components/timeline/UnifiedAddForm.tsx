"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useChecklistStore } from "@/store/useChecklistStore";
import { useTimelineStore } from "@/store/useTimelineStore";
import { CATEGORY_OPTIONS } from "@/lib/constants";
import { sendGAEvent } from "@/lib/analytics";
import type { ChecklistItem } from "@/types/checklist";
import type { TimelineItem } from "@/types/timeline";

type ItemType = "timeline" | "checklist";

interface UnifiedAddFormProps {
  onClose: () => void;
  timelineItems: TimelineItem[];
}

export function UnifiedAddForm({ onClose, timelineItems }: UnifiedAddFormProps) {
  const { addCustomItem: addChecklistItem } = useChecklistStore();
  const { addCustomItem: addTimelineItem } = useTimelineStore();

  const [itemType, setItemType] = useState<ItemType>("checklist");
  const [title, setTitle] = useState("");
  const [week, setWeek] = useState(12);
  const [category, setCategory] = useState<ChecklistItem["category"]>("hospital");
  const [description, setDescription] = useState("");
  const [showWeekAlert, setShowWeekAlert] = useState(false);

  const allTimelineWeeks = useMemo(
    () => new Set(timelineItems.map((item) => item.week)),
    [timelineItems]
  );

  const submitChecklist = (autoWeek: boolean) => {
    if (autoWeek) {
      addTimelineItem({
        id: `auto-week-${week}-${Date.now()}`,
        week,
        title: `${week}주차`,
        description: "",
        type: "prep",
        priority: "medium",
        isCustom: true,
      });
    }

    const categoryName = CATEGORY_OPTIONS.find((c) => c.value === category)?.label ?? "";
    addChecklistItem({
      id: `custom-${Date.now()}`,
      title: title.trim(),
      category,
      categoryName,
      recommendedWeek: week,
      priority: "medium",
      isCustom: true,
    });

    sendGAEvent("custom_item_add", { target: "checklist", category, ...(autoWeek && { auto_week: true }) });
    setShowWeekAlert(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || week < 1 || week > 40) return;

    if (itemType === "checklist") {
      if (!allTimelineWeeks.has(week)) {
        setShowWeekAlert(true);
        return;
      }
      submitChecklist(false);
    } else {
      addTimelineItem({
        id: `custom-timeline-${Date.now()}`,
        week,
        title: title.trim(),
        description: description.trim(),
        type: "prep",
        priority: "medium",
        isCustom: true,
      });
      sendGAEvent("custom_item_add", { target: "timeline", category: "prep" });
    }

    onClose();
  };

  return (
    <>
      <Card className="rounded-2xl shadow-md mb-6 border border-[#E4D6F0]/30 bg-[#E4D6F0]/5">
      <CardContent className="p-5">
        <h3 className="text-[15px] font-medium mb-4">새 항목 추가</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 유형 선택 */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2">유형</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="itemType"
                  value="timeline"
                  checked={itemType === "timeline"}
                  onChange={() => setItemType("timeline")}
                  className="accent-[#E4D6F0]"
                />
                <span className="text-sm">일정 (타임라인)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="itemType"
                  value="checklist"
                  checked={itemType === "checklist"}
                  onChange={() => setItemType("checklist")}
                  className="accent-[#FFD4DE]"
                />
                <span className="text-sm">할 일 (체크리스트)</span>
              </label>
            </div>
          </div>

          {/* 주차 (공통, 필수) */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              주차 <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={40}
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E4D6F0]/50"
            />
          </div>

          {/* 카테고리 (체크리스트일 때만) */}
          {itemType === "checklist" && (
            <div>
              <label className="block text-sm text-muted-foreground mb-1">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ChecklistItem["category"])}
                className="w-full px-3 py-2 rounded-xl border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E4D6F0]/50"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* 제목 (공통, 필수) */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              제목 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={itemType === "timeline" ? "일정을 입력하세요" : "할 일을 입력하세요"}
              className="w-full px-3 py-2 rounded-xl border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E4D6F0]/50"
              autoFocus
            />
          </div>

          {/* 설명 (타임라인일 때만) */}
          {itemType === "timeline" && (
            <div>
              <label className="block text-sm text-muted-foreground mb-1">설명 (선택)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="상세 설명을 입력하세요"
                className="w-full px-3 py-2 rounded-xl border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E4D6F0]/50"
              />
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="rounded-xl">
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!title.trim() || week < 1 || week > 40}
              className="rounded-xl bg-[#E4D6F0] text-[#3D4447] hover:bg-[#E4D6F0]/80"
            >
              추가하기
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <AlertDialog open={showWeekAlert} onOpenChange={setShowWeekAlert}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{week}주차에 타임라인 항목이 없습니다</AlertDialogTitle>
          <AlertDialogDescription>
            주차를 먼저 추가해야 할일이 표시됩니다. {week}주차를 추가하시겠어요?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => submitChecklist(true)}
            className="rounded-xl bg-[#E4D6F0] text-[#3D4447] hover:bg-[#E4D6F0]/80"
          >
            주차 추가하고 할일 넣기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
