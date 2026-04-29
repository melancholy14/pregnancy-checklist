"use client";

import { Pencil, Info } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/timeline/DeleteConfirmDialog";
import type { ChecklistItem } from "@/types/checklist";

const PRIORITY_STYLES: Record<ChecklistItem["priority"], { className: string; label: string }> = {
  high: { className: "bg-pastel-pink/60 text-accent-red", label: "높음" },
  medium: { className: "bg-pastel-yellow/60 text-accent-olive", label: "보통" },
  low: { className: "bg-pastel-mint/60 text-accent-green", label: "낮음" },
};

interface ChecklistItemRowProps {
  item: ChecklistItem;
  isChecked: boolean;
  isEditing: boolean;
  editTitle: string;
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
  isEditing,
  editTitle,
  onToggle,
  onStartEdit,
  onChangeEditTitle,
  onSaveEdit,
  onCancelEdit,
  onRemove,
}: ChecklistItemRowProps) {
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

  const priority = PRIORITY_STYLES[item.priority];

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
      aria-label={`${item.title} ${isChecked ? "체크 해제" : "체크"}`}
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
          className={`block text-sm leading-relaxed ${
            isChecked ? "line-through text-muted-foreground" : "text-foreground"
          }`}
        >
          {item.title}
        </span>
        {item.note && !isChecked && (
          <span className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
            <Info size={11} className="mt-0.5 shrink-0" />
            <span>{item.note}</span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Badge className={`${priority.className} text-[11px] px-2 py-0.5 rounded-md border-0`}>
          {priority.label}
        </Badge>
        {item.isCustom && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
