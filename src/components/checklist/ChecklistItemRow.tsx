"use client";

import { useEffect, useMemo, useRef } from "react";
import { Pencil, Info, Scale, CalendarCheck, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/timeline/DeleteConfirmDialog";
import { sendGAEvent } from "@/lib/analytics";
import { classifyNote, type NoteType } from "@/lib/note-classifier";
import type { ChecklistItem } from "@/types/checklist";

const PRIORITY_DOT: Record<ChecklistItem["priority"], { className: string; label: string }> = {
  high: { className: "bg-accent-red", label: "높음" },
  medium: { className: "bg-accent-olive", label: "보통" },
  low: { className: "bg-accent-green", label: "낮음" },
};

interface ChecklistItemRowProps {
  item: ChecklistItem;
  isChecked: boolean;
  isHighlighted: boolean;
  isEditing: boolean;
  editTitle: string;
  currentPregnancyWeek: number | null;
  isHydrated: boolean;
  onToggle: () => void;
  onStartEdit: () => void;
  onChangeEditTitle: (next: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemove: () => void;
}

export function ChecklistItemRow({
  item,
  isChecked,
  isHighlighted,
  isEditing,
  editTitle,
  currentPregnancyWeek,
  isHydrated,
  onToggle,
  onStartEdit,
  onChangeEditTitle,
  onSaveEdit,
  onCancelEdit,
  onRemove,
}: ChecklistItemRowProps) {
  const noteType: NoteType = useMemo(() => classifyNote(item.note), [item.note]);
  const showHighlightLabel = isHighlighted && !isChecked;
  const showUpcomingLabel =
    !isHighlighted &&
    currentPregnancyWeek !== null &&
    item.recommendedWeek > currentPregnancyWeek &&
    item.recommendedWeek !== 0 &&
    !isChecked;

  const upcomingViewSentRef = useRef(false);
  useEffect(() => {
    if (!isHydrated) return;
    if (!showUpcomingLabel) return;
    if (upcomingViewSentRef.current) return;
    if (currentPregnancyWeek === null) return;
    upcomingViewSentRef.current = true;
    sendGAEvent("upcoming_item_view", {
      item_id: item.id,
      weeks_ahead: item.recommendedWeek - currentPregnancyWeek,
    });
  }, [isHydrated, showUpcomingLabel, item.id, item.recommendedWeek, currentPregnancyWeek]);

  if (isEditing) {
    return (
      <div className="p-3 rounded-xl border border-pastel-lavender/30 bg-pastel-lavender/10 space-y-2">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => onChangeEditTitle(e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pastel-lavender/50"
          autoFocus
          aria-label="제목 수정"
        />
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancelEdit}
            className="rounded-lg h-8 text-xs"
          >
            취소
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSaveEdit}
            disabled={!editTitle.trim()}
            className="rounded-lg h-8 text-xs bg-pastel-lavender text-foreground hover:bg-pastel-lavender/80"
          >
            저장
          </Button>
        </div>
      </div>
    );
  }

  const priority = PRIORITY_DOT[item.priority];

  return (
    <div
      role="button"
      tabIndex={0}
      className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
        isChecked ? "bg-pastel-mint/20" : "hover:bg-muted/50"
      }`}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      aria-pressed={isChecked}
      aria-label={`${item.title} (우선순위 ${priority.label}) ${isChecked ? "체크 해제" : "체크"}`}
    >
      <Checkbox
        checked={isChecked}
        onCheckedChange={onToggle}
        className="size-5 mt-0.5 rounded-md border-2 data-[state=checked]:bg-pastel-mint data-[state=checked]:border-pastel-mint data-[state=checked]:text-foreground border-gray-200 shrink-0"
        onClick={(e) => e.stopPropagation()}
        aria-label={`${item.title} 체크박스`}
      />
      <div className="flex-1 min-w-0">
        <span
          className={`flex items-center gap-2 text-sm leading-relaxed ${
            isChecked ? "line-through text-muted-foreground" : "text-foreground"
          }`}
        >
          <span
            className={`inline-block size-1.5 rounded-full shrink-0 ${priority.className}`}
            aria-hidden="true"
          />
          <span className="min-w-0 break-words">{item.title}</span>
        </span>
        {showHighlightLabel && (
          <span className="mt-1 flex items-center gap-1 text-xs font-medium text-foreground">
            <CalendarCheck size={11} className="shrink-0" aria-hidden="true" />
            <span>이번 주 추천</span>
          </span>
        )}
        {showUpcomingLabel && (
          <span className="mt-1 flex items-center gap-1 text-xs font-normal text-muted-foreground">
            <Clock size={11} className="shrink-0" aria-hidden="true" />
            <span>{item.recommendedWeek}주차에 챙기기</span>
          </span>
        )}
        {item.note && (
          <span
            className={`mt-1 flex items-start gap-1 text-xs text-muted-foreground ${
              noteType === "legal" ? "italic" : ""
            } ${isChecked ? "line-through" : ""}`}
          >
            {noteType === "legal" ? (
              <Scale size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
            ) : (
              <Info size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
            )}
            <span>{item.note}</span>
          </span>
        )}
      </div>
      {item.isCustom && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartEdit();
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-accent-purple hover:bg-pastel-lavender/20 transition-colors"
            aria-label="수정"
          >
            <Pencil size={14} />
          </button>
          <span onClick={(e) => e.stopPropagation()}>
            <DeleteConfirmDialog onConfirm={onRemove} iconSize={14} />
          </span>
        </div>
      )}
    </div>
  );
}
