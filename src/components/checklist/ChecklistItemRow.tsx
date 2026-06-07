"use client";

import { useEffect, useMemo, useRef } from "react";
import { sendGAEvent } from "@/lib/analytics";
import { classifyNote, type NoteType } from "@/lib/note-classifier";
import { PRIORITY_LABEL } from "@/lib/constants";
import type { ChecklistItem } from "@/types/checklist";
import { ChecklistRow } from "./ChecklistRow";
import { EditItemForm, type EditItemFormValues } from "./EditItemForm";

interface ChecklistItemRowProps {
  item: ChecklistItem;
  slug: string;
  isChecked: boolean;
  isHighlighted: boolean;
  isEditing: boolean;
  currentPregnancyWeek: number | null;
  isHydrated: boolean;
  onToggle: () => void;
  onStartEdit: () => void;
  onSaveEdit: (next: EditItemFormValues) => void;
  onCancelEdit: () => void;
  onRemove: () => void;
}

export function ChecklistItemRow({
  item,
  slug,
  isChecked,
  isHighlighted,
  isEditing,
  currentPregnancyWeek,
  isHydrated,
  onToggle,
  onStartEdit,
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
    // slug 의존성은 GA 발사 자체가 slug-aware하지 않으므로 생략.
    void slug;
  }, [isHydrated, showUpcomingLabel, item.id, item.recommendedWeek, currentPregnancyWeek, slug]);

  if (isEditing) {
    return (
      <EditItemForm
        initialTitle={item.title}
        initialPriority={item.priority}
        initialNote={item.note ?? ""}
        onSave={onSaveEdit}
        onCancel={onCancelEdit}
      />
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
