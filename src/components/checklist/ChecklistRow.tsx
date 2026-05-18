"use client";

import {
  CalendarCheck,
  CheckIcon,
  Clock,
  Info,
  Pencil,
  Scale,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NoteType } from "@/lib/note-classifier";
import type { ChecklistItem } from "@/types/checklist";

const PRIORITY_DOT: Record<ChecklistItem["priority"], string> = {
  high: "bg-accent-red",
  medium: "bg-accent-olive",
  low: "bg-accent-green",
};

export interface ChecklistRowProps {
  id: string;
  title: string;
  isChecked: boolean;
  priority: ChecklistItem["priority"];
  priorityLabel: string;
  categoryLabel?: string;
  categoryToneClassName?: string;
  isHighlighted: boolean;
  showUpcomingLabel: boolean;
  upcomingWeek?: number;
  note?: string;
  noteType?: NoteType;
  isCustom?: boolean;
  onToggle: () => void;
  onStartEdit?: () => void;
  onRemove?: () => void;
}

export function ChecklistRow({
  id,
  title,
  isChecked,
  priority,
  priorityLabel,
  categoryLabel,
  categoryToneClassName,
  isHighlighted,
  showUpcomingLabel,
  upcomingWeek,
  note,
  noteType,
  isCustom,
  onToggle,
  onStartEdit,
  onRemove,
}: ChecklistRowProps) {
  const showHighlightLabel = isHighlighted && !isChecked;
  const priorityDot = PRIORITY_DOT[priority];

  return (
    <div className="flex items-start gap-3">
      <label
        htmlFor={id}
        className="flex-1 flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors duration-200 hover:bg-muted/50 has-[input:checked]:bg-pastel-mint/20"
      >
        <input
          id={id}
          type="checkbox"
          checked={isChecked}
          onChange={onToggle}
          className="sr-only peer"
        />
        <span
          aria-hidden="true"
          className="size-5 mt-0.5 shrink-0 rounded-md border-2 border-black/10 bg-input-background flex items-center justify-center peer-checked:bg-pastel-mint peer-checked:border-pastel-mint peer-focus-visible:ring-2 peer-focus-visible:ring-pastel-lavender peer-focus-visible:ring-offset-2 transition-colors"
        >
          <CheckIcon
            className="size-3.5 text-foreground opacity-0 peer-checked:opacity-100 transition-opacity"
            aria-hidden="true"
          />
        </span>
        <span className="sr-only">우선순위 {priorityLabel}, </span>
        <div className="flex-1 min-w-0">
          <span
            className={`flex items-center gap-2 text-sm leading-relaxed ${
              isChecked ? "line-through text-muted-foreground" : "text-foreground"
            }`}
          >
            <span
              aria-hidden="true"
              className={`inline-block size-1.5 rounded-full shrink-0 ${priorityDot}`}
            />
            <span className="min-w-0 break-words">{title}</span>
          </span>
          {showHighlightLabel && (
            <span className="mt-1 flex items-center gap-1 text-xs font-medium text-foreground">
              <CalendarCheck size={11} className="shrink-0" aria-hidden="true" />
              <span>이번 주 추천</span>
            </span>
          )}
          {showUpcomingLabel && upcomingWeek !== undefined && (
            <span className="mt-1 flex items-center gap-1 text-xs font-normal text-muted-foreground">
              <Clock size={11} className="shrink-0" aria-hidden="true" />
              <span>{upcomingWeek}주차에 챙기기</span>
            </span>
          )}
          {note && (
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
              <span>{note}</span>
            </span>
          )}
        </div>
        {categoryLabel && (
          <Badge
            className={`text-xs px-2 py-0.5 rounded-md border-0 shrink-0 mt-0.5 ${
              categoryToneClassName ?? ""
            }`}
          >
            {categoryLabel}
          </Badge>
        )}
      </label>
      {isCustom && (
        <div className="flex items-center gap-1 shrink-0 pt-2">
          {onStartEdit && (
            <button
              type="button"
              onClick={onStartEdit}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-accent-purple hover:bg-pastel-lavender/20 transition-colors"
              aria-label="수정"
            >
              <Pencil size={14} />
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="삭제"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
