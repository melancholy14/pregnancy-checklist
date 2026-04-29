"use client";

import { CATEGORY_FILTER_OPTIONS } from "@/lib/constants";
import { sendGAEvent } from "@/lib/analytics";

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_FILTER_OPTIONS.map((opt) => {
        const isActive = activeCategory === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => {
              onCategoryChange(opt.value);
              sendGAEvent("category_tab_switch", { category: opt.value });
            }}
            className={`px-4 py-2 rounded-xl whitespace-nowrap border text-sm transition-all duration-200 ${
              isActive
                ? "bg-pastel-pink/40 text-foreground border-pastel-pink/30"
                : "bg-white text-muted-foreground border-black/4 hover:bg-muted"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
