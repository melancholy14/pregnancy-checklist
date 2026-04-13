"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface TagFilterProps {
  tags: string[];
  selectedTag: string | null;
  onSelect: (tag: string | null) => void;
}

export function TagFilter({ tags, selectedTag, onSelect }: TagFilterProps) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) setOverflows(el.scrollHeight > el.clientHeight + 4);
  }, [tags]);

  return (
    <div>
      <div
        ref={listRef}
        className={`flex flex-wrap gap-2 overflow-hidden transition-[max-height] duration-300 ${
          expanded ? "max-h-[500px]" : "max-h-[5.5rem]"
        }`}
      >
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`px-4 py-2 rounded-xl border text-sm transition-all duration-200 ${
            selectedTag === null
              ? "bg-[#FFD4DE]/40 text-[#3D4447] border-[#FFD4DE]/30"
              : "bg-white text-[#9CA0A4] border-black/4 hover:bg-muted"
          }`}
        >
          전체
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onSelect(tag)}
            className={`px-4 py-2 rounded-xl border text-sm transition-all duration-200 ${
              selectedTag === tag
                ? "bg-[#FFD4DE]/40 text-[#3D4447] border-[#FFD4DE]/30"
                : "bg-white text-[#9CA0A4] border-black/4 hover:bg-muted"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
      {overflows && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 mt-2 text-xs text-[#9CA0A4] hover:text-[#3D4447] transition-colors"
        >
          {expanded ? "접기" : "더보기"}
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  );
}
