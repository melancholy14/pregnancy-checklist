"use client";

import { useCallback, useMemo, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useChecklistStore } from "@/store/useChecklistStore";
import { CATEGORY_OPTIONS, PRIORITY_LABEL } from "@/lib/constants";
import { sendGAEvent } from "@/lib/analytics";
import { classifyNote } from "@/lib/note-classifier";
import { getCategoryTokenClass } from "@/lib/data-token-classes";
import { restoreAtIndex, useDeleteWithUndo } from "@/lib/hooks/useDeleteWithUndo";
import { ChecklistRow } from "@/components/checklist/ChecklistRow";
import type { ChecklistItem } from "@/types/checklist";

interface WeekChecklistSectionProps {
  items: ChecklistItem[];
  checkedIds: string[];
  currentPregnancyWeek: number | null;
  slug: string;
}

export function WeekChecklistSection({
  items,
  checkedIds,
  currentPregnancyWeek,
  slug,
}: WeekChecklistSectionProps) {
  const { toggle, removeCustomItem, updateCustomItem } = useChecklistStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<ChecklistItem["category"]>("hospital");
  const [editWeek, setEditWeek] = useState(0);

  const restoreCustomChecklistItem = useCallback(
    (item: ChecklistItem & { atIndex: number }) => {
      const { atIndex, ...rest } = item;
      restoreAtIndex<ChecklistItem>(useChecklistStore, rest, atIndex);
    },
    []
  );

  const handleDeleteCustomItem = useDeleteWithUndo<ChecklistItem & { atIndex: number }>({
    removeFn: removeCustomItem,
    restoreFn: restoreCustomChecklistItem,
    label: "체크리스트 항목을 삭제했어요",
  });

  const checked = useMemo(
    () => items.filter((i) => checkedIds.includes(i.id)).length,
    [items, checkedIds]
  );
  const total = items.length;
  const percent = total > 0 ? (checked / total) * 100 : 0;

  const startEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditWeek(item.recommendedWeek);
  };

  const saveEdit = () => {
    if (!editingId || !editTitle.trim()) return;
    const categoryName = CATEGORY_OPTIONS.find((c) => c.value === editCategory)?.label ?? "";
    updateCustomItem(editingId, {
      title: editTitle.trim(),
      category: editCategory,
      categoryName,
      recommendedWeek: editWeek,
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleToggleItem = useCallback(
    (item: ChecklistItem) => {
      const willCheck = !checkedIds.includes(item.id);
      toggle(item.id);
      const noteType = classifyNote(item.note);
      sendGAEvent("checklist_check", {
        category: item.category,
        item_id: item.id,
        checked: willCheck,
        slug,
        note_type: item.note ? noteType : null,
      });
      const isHighlighted =
        currentPregnancyWeek !== null &&
        item.recommendedWeek !== 0 &&
        item.recommendedWeek === currentPregnancyWeek;
      if (willCheck && isHighlighted && currentPregnancyWeek !== null) {
        sendGAEvent("recommended_item_check", {
          item_id: item.id,
          category: item.category,
          week: currentPregnancyWeek,
          slug,
        });
      }
    },
    [checkedIds, toggle, slug, currentPregnancyWeek],
  );

  return (
    <div className="space-y-2 pt-2 pb-3">
      {items.map((item) => {
        const isChecked = checkedIds.includes(item.id);
        const isHighlighted =
          currentPregnancyWeek !== null &&
          item.recommendedWeek !== 0 &&
          item.recommendedWeek === currentPregnancyWeek;

        if (editingId === item.id) {
          return (
            <div key={item.id} className="p-3 rounded-xl border border-pastel-lavender/30 bg-pastel-lavender/10 space-y-2">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">제목</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pastel-lavender/50"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">카테고리</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as ChecklistItem["category"])}
                    className="w-full px-3 py-1.5 rounded-lg border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pastel-lavender/50"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">주차</label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={editWeek}
                    onChange={(e) => setEditWeek(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pastel-lavender/50"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={cancelEdit} className="rounded-lg h-8 text-xs">
                  취소
                </Button>
                <Button type="button" size="sm" onClick={saveEdit} disabled={!editTitle.trim()} className="rounded-lg h-8 text-xs bg-pastel-lavender text-foreground hover:bg-pastel-lavender/80">
                  저장
                </Button>
              </div>
            </div>
          );
        }

        return (
          <ChecklistRow
            key={item.id}
            id={`timeline-row-${slug}-${item.id}`}
            title={item.title}
            isChecked={isChecked}
            priority={item.priority}
            priorityLabel={PRIORITY_LABEL[item.priority]}
            categoryLabel={item.categoryName}
            categoryToneClassName={getCategoryTokenClass(item.category)}
            isHighlighted={isHighlighted}
            showUpcomingLabel={false}
            note={item.note}
            noteType={item.note ? classifyNote(item.note) : undefined}
            isCustom={item.isCustom}
            onToggle={() => handleToggleItem(item)}
            onStartEdit={() => startEdit(item)}
            onRemove={() => {
              const atIndex = useChecklistStore
                .getState()
                .customItems.findIndex((c) => c.id === item.id);
              if (atIndex < 0) return;
              handleDeleteCustomItem({ ...item, atIndex });
            }}
          />
        );
      })}

      {/* 진행률 바 */}
      <div className="pt-2 px-1">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-muted-foreground">진행률</span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {checked}/{total} ({Math.round(percent)}%)
          </span>
        </div>
        <Progress value={percent} className="h-1.5 bg-muted" />
      </div>
    </div>
  );
}
