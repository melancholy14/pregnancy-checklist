import { Check } from "lucide-react";

export function AllDoneBadge() {
  return (
    <div
      aria-label="모든 항목 완료"
      className="mb-4 flex items-center justify-center gap-1.5 rounded-xl bg-pastel-mint/40 px-4 py-2 text-sm font-semibold"
      style={{ color: "var(--accent-green)", wordBreak: "keep-all" }}
    >
      <span>모든 항목을 챙기셨어요</span>
      <Check size={16} strokeWidth={2.5} aria-hidden="true" />
    </div>
  );
}
