"use client";

import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { sendGAEvent } from "@/lib/analytics";
import { classifyNote, type NoteType } from "@/lib/note-classifier";
import { PRIORITY_LABEL } from "@/lib/constants";
import type { ChecklistItem } from "@/types/checklist";
import { ChecklistRow } from "./ChecklistRow";

interface ChecklistItemRowProps {
  item: ChecklistItem;
  slug: string;
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
  slug,
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

  return (
    <ChecklistRow
      id={`checklist-row-${slug}-${item.id}`}
      title={item.title}
      isChecked={isChecked}
      priority={item.priority}
      priorityLabel={PRIORITY_LABEL[item.priority]}
      isHighlighted={isHighlighted}
      showUpcomingLabel={showUpcomingLabel}
      upcomingWeek={item.recommendedWeek}
      note={item.note}
      noteType={noteType}
      isCustom={item.isCustom}
      onToggle={onToggle}
      onStartEdit={onStartEdit}
      onRemove={onRemove}
    />
  );
}
