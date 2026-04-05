"use client";

import { CATEGORY_FILTER_OPTIONS } from "@/lib/constants";

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {CATEGORY_FILTER_OPTIONS.map((opt) => {
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
