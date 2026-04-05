"use client";

interface TagFilterProps {
  tags: string[];
  selectedTag: string | null;
  onSelect: (tag: string | null) => void;
}

export function TagFilter({ tags, selectedTag, onSelect }: TagFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
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
  );
}
