"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sendGAEvent } from "@/lib/analytics";
import type { ChecklistCategory, ChecklistItem, ChecklistSubcategory } from "@/types/checklist";

interface ChecklistAddFormProps {
  storeSlug: string;
  subcategories: ChecklistSubcategory[];
  onAdd: (item: ChecklistItem) => void;
  onClose: () => void;
}

export function ChecklistAddForm({ storeSlug, subcategories, onAdd, onClose }: ChecklistAddFormProps) {
  const [title, setTitle] = useState("");
  // 빈 subcategories는 도메인 불변식 위반(JSON 데이터 오류). 카테고리 fallback을 임의로 만들지 않고
  // 아래에서 폼 렌더링을 막는다. 이 useState는 빈 문자열로 안전하게 초기화한다.
  const [category, setCategory] = useState<ChecklistCategory | "">(
    subcategories[0]?.key ?? ""
  );

  if (subcategories.length === 0) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        `ChecklistAddForm: subcategories가 비어 있습니다. (slug=${storeSlug}) JSON 데이터를 확인하세요.`
      );
    }
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || category === "") return;
    const sub = subcategories.find((s) => s.key === category);
    onAdd({
      id: `custom-${storeSlug}-${Date.now()}`,
      title: trimmed,
      category,
      categoryName: sub?.label ?? "",
      recommendedWeek: 0,
      priority: "medium",
      isCustom: true,
    });
    sendGAEvent("custom_item_add", { target: "checklist", category, slug: storeSlug });
    onClose();
  };

  return (
    <Card className="rounded-2xl shadow-md mb-6 border border-pastel-lavender/30 bg-pastel-lavender/10">
      <CardContent className="p-5">
        <h3 className="text-[15px] font-medium mb-4">새 항목 추가</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">분류</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ChecklistCategory)}
              className="w-full px-3 py-2 rounded-xl border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pastel-lavender/50"
              aria-label="분류 선택"
            >
              {subcategories.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              제목 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="할 일을 입력하세요"
              className="w-full px-3 py-2 rounded-xl border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pastel-lavender/50"
              autoFocus
              aria-label="할 일 제목"
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="rounded-xl">
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!title.trim()}
              className="rounded-xl bg-pastel-lavender text-foreground hover:bg-pastel-lavender/80"
            >
              추가하기
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
