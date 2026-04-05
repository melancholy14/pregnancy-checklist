"use client";

import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useChecklistStore } from "@/store/useChecklistStore";
import { CATEGORY_OPTIONS } from "@/lib/constants";
import { sendGAEvent } from "@/lib/analytics";
import type { ChecklistItem } from "@/types/checklist";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

const CATEGORY_COLORS: Record<string, string> = {
  hospital: "#FFD4DE",
  hospital_bag: "#FFE0CC",
  baby_items: "#D0EDE2",
  postpartum: "#E4D6F0",
  admin: "#FFF4D4",
};

interface WeekChecklistSectionProps {
  items: ChecklistItem[];
  checkedIds: string[];
}

export function WeekChecklistSection({ items, checkedIds }: WeekChecklistSectionProps) {
  const { toggle, removeCustomItem, updateCustomItem } = useChecklistStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<ChecklistItem["category"]>("hospital");
  const [editWeek, setEditWeek] = useState(0);

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

  return (
    <div className="space-y-2 pt-2 pb-3">
      {items.map((item) => {
        const isChecked = checkedIds.includes(item.id);
        const catColor = CATEGORY_COLORS[item.category] ?? "#E4D6F0";

        if (editingId === item.id) {
          return (
            <div key={item.id} className="p-3 rounded-xl border border-[#E4D6F0]/30 bg-[#E4D6F0]/5 space-y-2">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">제목</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E4D6F0]/50"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">카테고리</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as ChecklistItem["category"])}
                    className="w-full px-3 py-1.5 rounded-lg border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E4D6F0]/50"
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
                    className="w-full px-3 py-1.5 rounded-lg border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E4D6F0]/50"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={cancelEdit} className="rounded-lg h-8 text-xs">
                  취소
                </Button>
                <Button type="button" size="sm" onClick={saveEdit} disabled={!editTitle.trim()} className="rounded-lg h-8 text-xs bg-[#E4D6F0] text-[#3D4447] hover:bg-[#E4D6F0]/80">
                  저장
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
              isChecked
                ? "bg-[#D0EDE2]/15"
                : "hover:bg-muted/50"
            }`}
            onClick={() => {
              const willCheck = !checkedIds.includes(item.id);
              toggle(item.id);
              sendGAEvent("checklist_check", { category: item.category, item_id: item.id, checked: willCheck });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                const willCheck = !checkedIds.includes(item.id);
                toggle(item.id);
                sendGAEvent("checklist_check", { category: item.category, item_id: item.id, checked: willCheck });
              }
            }}
          >
            <Checkbox
              checked={isChecked}
              onCheckedChange={() => toggle(item.id)}
              className="size-5 rounded-md border-2 data-[state=checked]:bg-[#D0EDE2] data-[state=checked]:border-[#D0EDE2] data-[state=checked]:text-[#3D4447] border-gray-200 shrink-0"
              onClick={(e) => e.stopPropagation()}
            />
            <span
              className={`flex-1 text-sm ${
                isChecked ? "line-through text-[#9CA0A4]" : "text-foreground"
              }`}
            >
              {item.title}
            </span>
            <Badge
              className="text-xs px-2 py-0.5 rounded-lg border-0 shrink-0"
              style={{ backgroundColor: `${catColor}40`, color: "#3D4447" }}
            >
              {item.categoryName}
            </Badge>
            {item.isCustom && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(item);
                  }}
                  className="p-2 rounded-lg text-[#9CA0A4] hover:text-[#6B5A80] hover:bg-[#E4D6F0]/20 transition-colors"
                  aria-label="수정"
                >
                  <Pencil size={16} />
                </button>
                <span onClick={(e) => e.stopPropagation()}>
                  <DeleteConfirmDialog onConfirm={() => removeCustomItem(item.id)} iconSize={16} />
                </span>
              </div>
            )}
          </div>
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
