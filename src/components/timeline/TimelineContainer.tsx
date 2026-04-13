"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDueDateStore } from "@/store/useDueDateStore";
import { useTimelineStore } from "@/store/useTimelineStore";
import { useChecklistStore } from "@/store/useChecklistStore";
import { calcPregnancyWeek } from "@/lib/week-calculator";
import { getChecklistByWeek, getUnassignedChecklist } from "@/lib/checklist-week-map";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { TimelineItem } from "@/types/timeline";
import type { ChecklistItem } from "@/types/checklist";
import type { ArticleMeta } from "@/types/article";
import { TimelineAccordionCard } from "./TimelineAccordionCard";
import { UnifiedAddForm } from "./UnifiedAddForm";
import { CategoryFilter } from "./CategoryFilter";
import { WeekChecklistSection } from "./WeekChecklistSection";

interface TimelineContainerProps {
  timelineItems: TimelineItem[];
  checklistItems: ChecklistItem[];
  articles?: ArticleMeta[];
}

export function TimelineContainer({ timelineItems, checklistItems, articles = [] }: TimelineContainerProps) {
  const { dueDate } = useDueDateStore();
  const { customItems: customTimelineItems } = useTimelineStore();
  const { checkedIds, customItems: customChecklistItems } = useChecklistStore();
  const [hydrated, setHydrated] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showFirstCheckBanner, setShowFirstCheckBanner] = useState(false);
  const prevCheckedCountRef = useRef<number | null>(null);
  const currentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const currentWeek = useMemo(() => {
    if (!hydrated || !dueDate) return null;
    return calcPregnancyWeek(new Date(dueDate));
  }, [hydrated, dueDate]);

  const articleMap = useMemo(() => {
    const map = new Map<string, ArticleMeta>();
    for (const a of articles) {
      map.set(a.slug, a);
    }
    return map;
  }, [articles]);

  const allTimelineItems = useMemo(() => {
    return [...timelineItems, ...customTimelineItems].sort((a, b) => a.week - b.week);
  }, [timelineItems, customTimelineItems]);

  const weekChecklistMap = useMemo(() => {
    return getChecklistByWeek(allTimelineItems, checklistItems, customChecklistItems);
  }, [allTimelineItems, checklistItems, customChecklistItems]);

  const unassignedChecklist = useMemo(() => {
    return getUnassignedChecklist(customChecklistItems);
  }, [customChecklistItems]);

  // 카테고리 필터 적용
  const getFilteredChecklist = useCallback(
    (items: ChecklistItem[]): ChecklistItem[] => {
      if (activeCategory === "all") return items;
      return items.filter((item) => item.category === activeCategory);
    },
    [activeCategory]
  );

  // 전체 진행률
  const allChecklistItems = useMemo(() => {
    return [...checklistItems, ...customChecklistItems];
  }, [checklistItems, customChecklistItems]);

  const progress = useMemo(() => {
    const total = allChecklistItems.length;
    const checked = allChecklistItems.filter((i) => checkedIds.includes(i.id)).length;
    return { total, checked, percent: total > 0 ? (checked / total) * 100 : 0 };
  }, [allChecklistItems, checkedIds]);

  // 카테고리 필터 적용 시 체크리스트가 없는 주차를 숨길지 여부 (미리 계산)
  const filteredWeekSet = useMemo(() => {
    if (activeCategory === "all") return null; // null = 전체 표시
    const set = new Set<number>();
    for (const [week, items] of weekChecklistMap) {
      if (items.some((item) => item.category === activeCategory)) {
        set.add(week);
      }
    }
    return set;
  }, [activeCategory, weekChecklistMap]);

  // 첫 체크 시 인라인 배너 (1회성)
  useEffect(() => {
    if (!hydrated) return;
    const count = checkedIds.length;
    if (prevCheckedCountRef.current !== null && prevCheckedCountRef.current === 0 && count === 1) {
      try {
        const shown = localStorage.getItem("first-check-guide-shown");
        if (!shown) {
          setShowFirstCheckBanner(true);
          localStorage.setItem("first-check-guide-shown", "true");
        }
      } catch {
        // localStorage 접근 불가 시 무시
      }
    }
    prevCheckedCountRef.current = count;
  }, [hydrated, checkedIds]);

  // 현재 주차로 자동 스크롤
  useEffect(() => {
    if (hydrated && currentWeek && currentRef.current) {
      setTimeout(() => {
        currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [hydrated, currentWeek]);

  const getStatus = useCallback(
    (week: number): "past" | "current" | "future" => {
      if (!currentWeek) return "future";
      if (week < currentWeek - 1) return "past";
      if (week <= currentWeek + 1) return "current";
      return "future";
    },
    [currentWeek]
  );

  return (
    <div className="min-h-screen pb-24 px-4 bg-linear-to-b from-[#FFFAF7] to-white">
      <div className="pt-8">
        <h1 className="mb-2 text-center">임신 타임라인</h1>
        <p className="text-center text-muted-foreground mb-6">
          주차별 일정과 체크리스트를 한눈에 확인하세요
        </p>

        {/* 현재 주차 카드 */}
        {hydrated && currentWeek !== null && (
          <Card className="rounded-2xl shadow-md mb-4 border border-black/4">
            <CardContent className="p-4 text-center">
              <span className="text-sm text-muted-foreground">현재</span>
              <div className="text-2xl mt-1">
                <strong>{currentWeek}주</strong>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 전체 진행률 */}
        {hydrated && (
          <Card className="rounded-2xl shadow-md mb-6 border border-black/4">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">전체 진행률</span>
                <span className="text-sm tabular-nums">
                  <strong>{progress.checked}</strong>
                  <span className="text-muted-foreground">/{progress.total}</span> 완료
                </span>
              </div>
              <Progress value={progress.percent} className="h-2 bg-muted" />
              {progress.percent >= 25 && (
                <p className="text-xs text-center mt-2 text-[#2D6B4F] font-medium">
                  {progress.percent >= 100
                    ? "완벽한 준비 완료! 🎊"
                    : progress.percent >= 75
                      ? "거의 다 왔어요!"
                      : progress.percent >= 50
                        ? "절반 완료!"
                        : "순조로운 출발!"}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* 첫 체크 인라인 배너 */}
        {showFirstCheckBanner && (
          <Card className="rounded-2xl border border-[#D0EDE2]/50 bg-[#D0EDE2]/10 mb-6">
            <CardContent className="p-4 flex items-start gap-3">
              <span className="w-9 h-9 rounded-xl bg-[#D0EDE2] flex items-center justify-center shrink-0 mt-0.5">
                <Save size={18} strokeWidth={1.8} className="text-[#3D4447]" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium mb-0.5">체크한 내용은 자동 저장돼요!</p>
                <p className="text-xs text-muted-foreground">다시 방문해도 기록이 남아있어요</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFirstCheckBanner(false)}
                className="rounded-lg h-8 text-xs shrink-0"
                aria-label="배너 닫기"
              >
                확인
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 카테고리 필터 */}
        <div className="mb-6">
          <CategoryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          {activeCategory === "admin" && (
            <div className="mt-3 px-4 py-3 rounded-xl bg-[#FFF4D4]/40 border border-[#FFF4D4]/60">
              <p className="text-xs text-[#8B7520] leading-relaxed">
                행정 관련 항목은 거주 지자체에 따라 다를 수 있습니다. 정확한 정보는 주민센터 또는 정부24를 확인해주세요.
              </p>
            </div>
          )}
        </div>

        {/* 통합 추가 폼 */}
        {showAddForm && <UnifiedAddForm onClose={() => setShowAddForm(false)} timelineItems={allTimelineItems} />}

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-linear-to-b from-[#FFD4DE] via-[#E4D6F0] to-[#FFF4D4] opacity-60" />

          <div className="space-y-6">
            {(() => {
              let firstCurrentAssigned = false;
              return allTimelineItems
                .filter((item) => filteredWeekSet === null || filteredWeekSet.has(item.week))
                .map((item) => {
                  const status = getStatus(item.week);
                  const shouldRef = status === "current" && !firstCurrentAssigned;
                  if (shouldRef) firstCurrentAssigned = true;
                  const weekChecklist = getFilteredChecklist(weekChecklistMap.get(item.week) ?? []);
                  const relatedArticles = (item.linked_article_slugs ?? [])
                    .map((slug) => articleMap.get(slug))
                    .filter((a): a is ArticleMeta => a !== undefined);

                  return (
                    <div key={item.id} ref={shouldRef ? currentRef : undefined}>
                      <TimelineAccordionCard
                        item={item}
                        status={status}
                        checklistItems={weekChecklist}
                        checkedIds={hydrated ? checkedIds : []}
                        relatedArticles={relatedArticles}
                        defaultOpen={status === "current"}
                      />
                    </div>
                  );
                });
            })()}
          </div>
        </div>

        {/* 기타 섹션 (주차 미지정) */}
        {hydrated && unassignedChecklist.length > 0 && activeCategory === "all" && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3 pl-2">
              <span className="text-base">📦</span>
              <h2 className="text-[15px] font-medium text-muted-foreground">기타 (주차 미지정)</h2>
            </div>
            <Card className="rounded-xl border border-black/4">
              <CardContent className="p-2">
                <WeekChecklistSection items={unassignedChecklist} checkedIds={checkedIds} />
              </CardContent>
            </Card>
          </div>
        )}

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
          className="fixed fab-bottom-safe right-6 w-14 h-14 rounded-2xl bg-[#E4D6F0] shadow-lg flex items-center justify-center hover:bg-[#E4D6F0]/80 hover:shadow-xl transition-all duration-200 z-10"
          aria-label="항목 추가"
        >
          <Plus size={24} color="#3D4447" />
        </button>
      </div>
    </div>
  );
}
