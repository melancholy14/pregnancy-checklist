"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRIORITY_LABEL } from "@/lib/constants";
import type { ChecklistItem } from "@/types/checklist";

export type Priority = ChecklistItem["priority"];

interface PrioritySelectProps {
  value: Priority;
  onChange: (next: Priority) => void;
  id?: string;
  className?: string;
}

const OPTIONS: readonly Priority[] = ["high", "medium", "low"];

export function PrioritySelect({ value, onChange, id, className }: PrioritySelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Priority)}>
      <SelectTrigger
        id={id}
        aria-label="우선순위"
        className={className ?? "w-full"}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((p) => (
          <SelectItem key={p} value={p}>
            {PRIORITY_LABEL[p]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
