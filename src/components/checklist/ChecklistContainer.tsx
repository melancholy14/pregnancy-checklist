"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { useChecklistStore } from "@/store/useChecklistStore";
import { useDueDateStore } from "@/store/useDueDateStore";
import { calcPregnancyWeek } from "@/lib/week-calculator";
import type { ChecklistItem as ChecklistItemType } from "@/types/checklist";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProgressSummary } from "./ProgressSummary";
import { ChecklistItem } from "./ChecklistItem";
import { ChecklistAddForm } from "./ChecklistAddForm";

const CATEGORY_MAP: Record<string, string> = {
  hospital: "병원 준비",
  hospital_bag: "출산 가방",
  baby_items: "신생아 준비",
  postpartum: "산후 준비",
  admin: "행정 준비",
};

const categories = Object.keys(CATEGORY_MAP);

interface ChecklistContainerProps {
  items: ChecklistItemType[];
}

export function ChecklistContainer({ items }: ChecklistContainerProps) {
  const { checkedIds, customItems, toggle, removeCustomItem } = useChecklistStore();
  const { dueDate } = useDueDateStore();
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [hydrated, setHydrated] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const currentWeek = useMemo(() => {
    if (!hydrated || !dueDate) return null;
    return calcPregnancyWeek(new Date(dueDate));
  }, [hydrated, dueDate]);

  const allItems = useMemo(() => {
    return [...items, ...customItems];
  }, [items, customItems]);

  const itemsByCategory = useMemo(() => {
    const map: Record<string, ChecklistItemType[]> = {};
    for (const cat of categories) {
      map[cat] = allItems.filter((item) => item.category === cat);
    }
    return map;
  }, [allItems]);

  const progress = useMemo(() => {
    const total = allItems.length;
    const checked = allItems.filter((i) => checkedIds.includes(i.id)).length;
    return { total, checked };
  }, [allItems, checkedIds]);

  const categoryProgress = useMemo(() => {
    const map: Record<string, { total: number; checked: number }> = {};
    for (const cat of categories) {
      const catItems = itemsByCategory[cat] || [];
      map[cat] = {
        total: catItems.length,
        checked: catItems.filter((i) => checkedIds.includes(i.id)).length,
      };
    }
    return map;
  }, [itemsByCategory, checkedIds]);

  const isHighlighted = (item: ChecklistItemType) => {
    if (!currentWeek || item.recommendedWeek === 0) return false;
    return Math.abs(item.recommendedWeek - currentWeek) <= 1;
  };

  const progressPercent =
    hydrated && progress.total > 0
      ? (progress.checked / progress.total) * 100
      : 0;

  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="max-w-3xl mx-auto pt-8">
        <h1 className="mb-6 text-center">출산 준비 체크리스트</h1>

        <ProgressSummary
          checked={hydrated ? progress.checked : 0}
          total={progress.total}
          percent={progressPercent}
        />

        {showAddForm && (
          <ChecklistAddForm
            activeCategory={activeCategory}
            onClose={() => setShowAddForm(false)}
          />
        )}

        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="flex gap-2 overflow-x-auto pb-4 mb-6 bg-transparent h-auto p-0 w-full">
            {categories.map((category) => {
              const prog = categoryProgress[category];
              return (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="px-5 py-2.5 rounded-xl whitespace-nowrap border border-black/4 bg-white text-[#9CA0A4] hover:bg-muted data-[state=active]:bg-[#FFD4DE]/40 data-[state=active]:text-[#3D4447] data-[state=active]:border-[#FFD4DE]/30 h-auto flex-none transition-all duration-200"
                >
                  {CATEGORY_MAP[category]}
                  <span className="ml-2 text-xs opacity-60">
                    {hydrated ? prog.checked : 0}/{prog.total}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="space-y-2.5">
                {(itemsByCategory[category] || []).map((item) => (
                  <ChecklistItem
                    key={item.id}
                    item={item}
                    isChecked={hydrated && checkedIds.includes(item.id)}
                    isHighlighted={hydrated && isHighlighted(item)}
                    onToggle={() => toggle(item.id)}
                    onDelete={item.isCustom ? () => removeCustomItem(item.id) : undefined}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* FAB: 커스텀 항목 추가 */}
        <button
          onClick={() => setShowAddForm(true)}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-2xl bg-[#FFD4DE] shadow-lg flex items-center justify-center hover:bg-[#FFD4DE]/80 hover:shadow-xl transition-all duration-200 z-10"
          aria-label="항목 추가"
        >
          <Plus size={24} color="#3D4447" />
        </button>
      </div>
    </div>
  );
}
