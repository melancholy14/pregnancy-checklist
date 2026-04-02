"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useChecklistStore } from "@/store/useChecklistStore";
import type { ChecklistItem } from "@/types/checklist";

const CATEGORY_OPTIONS: { value: ChecklistItem["category"]; label: string }[] = [
  { value: "hospital", label: "병원 준비" },
  { value: "hospital_bag", label: "출산 가방" },
  { value: "baby_items", label: "신생아 준비" },
  { value: "postpartum", label: "산후 준비" },
  { value: "admin", label: "행정 준비" },
];

interface ChecklistAddFormProps {
  activeCategory: string;
  onClose: () => void;
}

export function ChecklistAddForm({ activeCategory, onClose }: ChecklistAddFormProps) {
  const { addCustomItem } = useChecklistStore();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ChecklistItem["category"]>(() => {
    const valid = CATEGORY_OPTIONS.some((c) => c.value === activeCategory);
    return valid ? (activeCategory as ChecklistItem["category"]) : "hospital";
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const categoryName = CATEGORY_OPTIONS.find((c) => c.value === category)?.label ?? "";

    addCustomItem({
      id: `custom-${Date.now()}`,
      title: title.trim(),
      category,
      categoryName,
      recommendedWeek: 0,
      priority: "medium",
      isCustom: true,
    });

    setTitle("");
    onClose();
  };

  return (
    <Card className="rounded-2xl shadow-md mb-4 border border-[#FFD4DE]/30 bg-[#FFD4DE]/5">
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ChecklistItem["category"])}
              className="w-full px-3 py-2 rounded-xl border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD4DE]/50"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">항목명</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="추가할 항목을 입력하세요"
              className="w-full px-3 py-2 rounded-xl border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD4DE]/50"
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-xl"
            >
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!title.trim()}
              className="rounded-xl bg-[#FFD4DE] text-[#3D4447] hover:bg-[#FFD4DE]/80"
            >
              추가
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
