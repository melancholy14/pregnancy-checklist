"use client";

import type { ChecklistItem } from "@/types/checklist";

const CATEGORY_OPTIONS: { value: ChecklistItem["category"] | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "hospital", label: "병원 준비" },
  { value: "hospital_bag", label: "출산 가방" },
  { value: "baby_items", label: "신생아 준비" },
  { value: "postpartum", label: "산후 준비" },
  { value: "admin", label: "행정 준비" },
];

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {CATEGORY_OPTIONS.map((opt) => {
        const isActive = activeCategory === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onCategoryChange(opt.value)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap border text-sm transition-all duration-200 ${
              isActive
                ? "bg-[#FFD4DE]/40 text-[#3D4447] border-[#FFD4DE]/30"
                : "bg-white text-[#9CA0A4] border-black/4 hover:bg-muted"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
