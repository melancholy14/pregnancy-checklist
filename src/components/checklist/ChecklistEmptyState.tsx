"use client";

import { ListChecks } from "lucide-react";

export type ChecklistEmptyStateCase = "first_visit" | "migration_lost" | "custom_only";

interface ChecklistEmptyStateProps {
  case: ChecklistEmptyStateCase;
  onBrowse?: () => void;
  onMigrationConfirm?: () => void;
}

export function ChecklistEmptyState({
  case: emptyCase,
  onBrowse,
  onMigrationConfirm,
}: ChecklistEmptyStateProps) {
  if (emptyCase === "first_visit") {
    return (
      <section
        role="status"
        aria-live="polite"
        className="mb-6 rounded-2xl border border-black/4 bg-card shadow-sm"
        style={{ wordBreak: "keep-all" }}
      >
        <div className="flex flex-col items-center text-center px-6 py-8">
          <span
            aria-hidden="true"
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-pastel-lavender/40 text-accent-purple"
          >
            <ListChecks size={24} strokeWidth={1.75} />
          </span>
          <p className="text-sm text-foreground/85 leading-relaxed mb-4">
            체크리스트가 비어 있어요. 항목을 살펴보시겠어요?
          </p>
          <button
            type="button"
            onClick={onBrowse}
            aria-label="체크리스트 항목 둘러보기"
            className="bg-pastel-lavender text-foreground hover:bg-pastel-lavender/80 rounded-xl px-6 h-10 text-sm font-semibold transition-colors"
          >
            둘러보기
          </button>
        </div>
      </section>
    );
  }

  if (emptyCase === "migration_lost") {
    return (
      <div
        role="alert"
        className="mb-6 rounded-2xl border border-pastel-peach/40 bg-pastel-peach/30 p-4"
        style={{ wordBreak: "keep-all" }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground/90 leading-relaxed">
            체크 기록을 새로 시작해요. 항목은 그대로 보여드릴게요.
          </p>
          <button
            type="button"
            onClick={onMigrationConfirm}
            aria-label="안내 닫기"
            className="self-start sm:self-auto bg-pastel-lavender text-foreground hover:bg-pastel-lavender/80 rounded-xl px-5 h-9 text-sm font-semibold transition-colors shrink-0"
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  return (
    <p
      role="status"
      aria-live="polite"
      className="mb-4 text-xs leading-relaxed"
      style={{ color: "var(--prose-muted, #7A7F83)", wordBreak: "keep-all" }}
    >
      기본 항목이 비어 있어요. 추가하신 항목은 그대로 보여드릴게요.
    </p>
  );
}
