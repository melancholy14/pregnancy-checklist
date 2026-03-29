"use client";

import { useState, useEffect, useMemo } from "react";
import { useChecklistStore } from "@/store/useChecklistStore";
import checklistItems from "@/data/checklist_items.json";
import type { ChecklistItem } from "@/types/checklist";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORY_MAP: Record<string, string> = {
  hospital: "병원 준비",
  hospital_bag: "출산 가방",
  baby_items: "신생아 준비",
  postpartum: "산후 준비",
  admin: "행정 준비",
};

const categories = Object.keys(CATEGORY_MAP);

export default function ChecklistPage() {
  const { checkedIds, customItems, toggle } = useChecklistStore();
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const allItems = useMemo(() => {
    const baseItems = checklistItems as ChecklistItem[];
    return [...baseItems, ...customItems];
  }, [customItems]);

  const getItemsByCategory = (category: string) =>
    allItems.filter((item) => item.category === category);

  const getTotalProgress = () => {
    const total = allItems.length;
    const checked = allItems.filter((i) => checkedIds.includes(i.id)).length;
    return { total, checked };
  };

  const getCategoryProgress = (category: string) => {
    const items = getItemsByCategory(category);
    const checked = items.filter((i) => checkedIds.includes(i.id)).length;
    return { total: items.length, checked };
  };

  const progress = getTotalProgress();
  const currentItems = getItemsByCategory(activeCategory);
  const progressPercent = hydrated && progress.total > 0
    ? (progress.checked / progress.total) * 100
    : 0;

  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="max-w-3xl mx-auto pt-8">
        <h1 className="mb-6 text-center">출산 준비 체크리스트</h1>

        {/* Progress Card */}
        <Card className="rounded-3xl shadow-md mb-6 border-0">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-2">
              <span>전체 진행률</span>
              <span className="text-lg">
                <strong>{hydrated ? progress.checked : 0}</strong>/{progress.total} 완료
              </span>
            </div>
            <Progress
              value={progressPercent}
              className="h-3 bg-gray-100"
            />
          </CardContent>
        </Card>

        {/* Category Tabs */}
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
                {getItemsByCategory(category).map((item) => {
                  const isChecked = hydrated && checkedIds.includes(item.id);
                  return (
                    <Card
                      key={item.id}
                      className={`rounded-2xl shadow-sm cursor-pointer transition-all hover:shadow-md border-0 ${
                        isChecked ? "bg-[#D5F0E8]/30" : "bg-white"
                      }`}
                      onClick={() => toggle(item.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggle(item.id)}
                            className="size-7 rounded-full border-2 data-[state=checked]:bg-[#D5F0E8] data-[state=checked]:border-[#D5F0E8] data-[state=checked]:text-[#4A4A4A] border-gray-300"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span
                            className={`flex-1 ${
                              isChecked ? "line-through text-gray-400" : "text-gray-700"
                            }`}
                          >
                            {item.title}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
