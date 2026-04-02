"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useDueDateStore } from "@/store/useDueDateStore";
import { useTimelineStore } from "@/store/useTimelineStore";
import { calcPregnancyWeek } from "@/lib/week-calculator";
import { Card, CardContent } from "@/components/ui/card";
import type { TimelineItem } from "@/types/timeline";
import { TimelineCard } from "./TimelineCard";
import { TimelineAddForm } from "./TimelineAddForm";

interface TimelineContainerProps {
  items: TimelineItem[];
}

export function TimelineContainer({ items }: TimelineContainerProps) {
  const { dueDate } = useDueDateStore();
  const { customItems, removeCustomItem } = useTimelineStore();
  const [hydrated, setHydrated] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const currentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const currentWeek = useMemo(() => {
    if (!hydrated || !dueDate) return null;
    return calcPregnancyWeek(new Date(dueDate));
  }, [hydrated, dueDate]);

  const allItems = useMemo(() => {
    return [...items, ...customItems].sort((a, b) => a.week - b.week);
  }, [items, customItems]);

  // 현재 주차로 자동 스크롤
  useEffect(() => {
    if (hydrated && currentWeek && currentRef.current) {
      setTimeout(() => {
        currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [hydrated, currentWeek]);

  const getStatus = (week: number): "past" | "current" | "future" => {
    if (!currentWeek) return "future";
    if (week < currentWeek - 1) return "past";
    if (week <= currentWeek + 1) return "current";
    return "future";
  };

  return (
    <div className="min-h-screen pb-24 px-4 bg-linear-to-b from-[#FFFAF7] to-white">
      <div className="max-w-2xl mx-auto pt-8">
        <h1 className="mb-2 text-center">임신 타임라인</h1>
        <p className="text-center text-muted-foreground mb-8">
          주차별 중요한 순간들을 확인하세요
        </p>

        {hydrated && currentWeek !== null && (
          <Card className="rounded-2xl shadow-md mb-8 border border-black/4">
            <CardContent className="p-4 text-center">
              <span className="text-sm text-muted-foreground">현재</span>
              <div className="text-2xl mt-1">
                <strong>{currentWeek}주</strong>
              </div>
            </CardContent>
          </Card>
        )}

        {showAddForm && <TimelineAddForm onClose={() => setShowAddForm(false)} />}

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-linear-to-b from-[#FFD4DE] via-[#E4D6F0] to-[#FFF4D4] opacity-60" />

          <div className="space-y-6">
            {allItems.map((item) => {
              const status = getStatus(item.week);
              const isCurrent = status === "current";
              return (
                <div key={item.id} ref={isCurrent ? currentRef : undefined}>
                  <TimelineCard
                    item={item}
                    status={status}
                    onDelete={item.isCustom ? () => removeCustomItem(item.id) : undefined}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Final Message */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-linear-to-r from-[#FFD4DE]/60 to-[#E4D6F0]/60 rounded-2xl px-8 py-5 shadow-md border border-black/4">
            <div className="text-4xl mb-2">👶</div>
            <div className="text-sm text-foreground">
              40주차: 소중한 아기와의 만남!
            </div>
          </div>
        </div>

        {/* FAB: 커스텀 항목 추가 */}
        <button
          onClick={() => setShowAddForm(true)}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-2xl bg-[#E4D6F0] shadow-lg flex items-center justify-center hover:bg-[#E4D6F0]/80 hover:shadow-xl transition-all duration-200 z-10"
          aria-label="항목 추가"
        >
          <Plus size={24} color="#3D4447" />
        </button>
      </div>
    </div>
  );
}
