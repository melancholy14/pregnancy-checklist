"use client";

import { useState, useEffect, useMemo } from "react";
import { useChecklistStore } from "@/store/useChecklistStore";
import type { ChecklistItem as ChecklistItemType } from "@/types/checklist";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProgressSummary } from "./ProgressSummary";
import { ChecklistItem } from "./ChecklistItem";

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
  const { checkedIds, customItems, toggle } = useChecklistStore();
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const allItems = useMemo(() => {
    return [...items, ...customItems];
  }, [items, customItems]);

  const getItemsByCategory = (category: string) =>
    allItems.filter((item) => item.category === category);

  const getTotalProgress = () => {
    const total = allItems.length;
    const checked = allItems.filter((i) => checkedIds.includes(i.id)).length;
    return { total, checked };
  };

  const getCategoryProgress = (category: string) => {
    const categoryItems = getItemsByCategory(category);
    const checked = categoryItems.filter((i) => checkedIds.includes(i.id)).length;
    return { total: categoryItems.length, checked };
  };

  const progress = getTotalProgress();
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

        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="flex gap-2 overflow-x-auto pb-4 mb-6 bg-transparent h-auto p-0 w-full">
            {categories.map((category) => {
              const prog = getCategoryProgress(category);
              return (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="px-6 py-3 rounded-full whitespace-nowrap shadow-sm border-0 bg-white text-gray-600 hover:bg-gray-50 data-[state=active]:bg-[#FFD6E0] data-[state=active]:text-[#4A4A4A] data-[state=active]:shadow-sm h-auto flex-none"
                >
                  {CATEGORY_MAP[category]}
                  <span className="ml-2 text-xs opacity-70">
                    {hydrated ? prog.checked : 0}/{prog.total}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="space-y-3">
                {getItemsByCategory(category).map((item) => (
                  <ChecklistItem
                    key={item.id}
                    item={item}
                    isChecked={hydrated && checkedIds.includes(item.id)}
                    onToggle={() => toggle(item.id)}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
