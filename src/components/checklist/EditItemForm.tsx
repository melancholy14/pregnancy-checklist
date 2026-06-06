"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PrioritySelect } from "./PrioritySelect";
import type { ChecklistItem } from "@/types/checklist";

export interface EditItemFormValues {
  title: string;
  priority: ChecklistItem["priority"];
  note: string;
}

interface EditItemFormProps {
  initialTitle: string;
  initialPriority: ChecklistItem["priority"];
  initialNote: string;
  onSave: (next: EditItemFormValues) => void;
  onCancel: () => void;
}

const NOTE_MAX_LENGTH = 500;
const NOTE_COUNTER_THRESHOLD = 450;

export function EditItemForm({
  initialTitle,
  initialPriority,
  initialNote,
  onSave,
  onCancel,
}: EditItemFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [priority, setPriority] = useState<ChecklistItem["priority"]>(initialPriority);
  const [note, setNote] = useState(initialNote);

  const trimmedTitle = title.trim();
  const canSave = trimmedTitle.length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSave) return;
        onSave({ title: trimmedTitle, priority, note: note.trim() });
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
      className="p-3 rounded-2xl border border-black/4 bg-card shadow-sm space-y-3"
      style={{ wordBreak: "keep-all" }}
      data-slot="edit-item-form"
    >
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg border border-black/6 bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-pastel-lavender/50"
          autoFocus
          aria-label="항목 이름"
          placeholder="항목 이름"
        />
        {!canSave && (
          <p
            className="mt-1 text-xs text-muted-foreground"
            style={{ wordBreak: "keep-all" }}
          >
            제목을 입력하세요
          </p>
        )}
      </div>

      <PrioritySelect value={priority} onChange={setPriority} />

      <div>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX_LENGTH))}
          rows={3}
          maxLength={NOTE_MAX_LENGTH}
          aria-label="메모"
          placeholder="메모를 입력하세요"
          className="text-sm min-h-20"
        />
        {note.length > NOTE_COUNTER_THRESHOLD && (
          <p className="mt-1 text-right text-xs text-muted-foreground tabular-nums">
            {note.length}/{NOTE_MAX_LENGTH}
          </p>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="rounded-lg h-8 text-xs"
          aria-label="취소"
        >
          취소
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!canSave}
          className="rounded-lg h-8 text-xs bg-pastel-pink text-foreground hover:bg-pastel-pink/80"
          aria-label="저장"
        >
          저장
        </Button>
      </div>
    </form>
  );
}
