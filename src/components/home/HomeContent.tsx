"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { DueDateInput } from "@/components/home/DueDateInput";
import { DashboardCard } from "@/components/home/DashboardCard";
import { useDueDateStore } from "@/store/useDueDateStore";
import { useChecklistStore } from "@/store/useChecklistStore";
import { useTimelineStore } from "@/store/useTimelineStore";
import { useWeightStore } from "@/store/useWeightStore";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { calcPregnancyWeek } from "@/lib/week-calculator";
import { getChecklistByWeek } from "@/lib/checklist-week-map";
import checklistItems from "@/data/checklist_items.json";
import timelineItems from "@/data/timeline_items.json";
import babyfairEvents from "@/data/babyfair_events.json";
import videosData from "@/data/videos.json";
import type { ChecklistItem } from "@/types/checklist";
import type { TimelineItem } from "@/types/timeline";

interface ArticleInfo {
  title: string;
  slug: string;
}

export interface HomeContentProps {
  articles?: ArticleInfo[];
}

export function HomeContent({ articles = [] }: HomeContentProps) {
  const { dueDate } = useDueDateStore();
  const { checkedIds, customItems } = useChecklistStore();
  const { customItems: customTimelineItems } = useTimelineStore();
  const { logs: weightLogs } = useWeightStore();
  const [hydrated, setHydrated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [returningMessage, setReturningMessage] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
    try {
      const completed = localStorage.getItem("onboarding-completed");
      if (!completed) setShowOnboarding(true);

      // 재방문 유저 웰컴 메시지
      const lastVisit = localStorage.getItem("last-visit-date");
      const today = new Date().toISOString().split("T")[0];
      if (lastVisit && lastVisit !== today) {
        const checkedCount = JSON.parse(localStorage.getItem("checklist-storage") || "{}").state?.checkedIds?.length;
        if (checkedCount > 0) {
          setReturningMessage(`돌아오셨군요! 지난번에 ${checkedCount}개 체크하셨어요 ✨`);
        }
      }
      localStorage.setItem("last-visit-date", today);
    } catch {
      // localStorage 접근 불가 시 무시
    }
  }, []);

  // 예정일 첫 입력 시 토스트 표시 (1회만)
  useEffect(() => {
    if (!hydrated || !dueDate) return;
    try {
      const hasShown = localStorage.getItem("due-date-toast-shown");
      if (!hasShown) {
        toast("데이터는 이 브라우저에만 저장됩니다", {
          description: "다른 기기에서는 데이터가 공유되지 않아요",
          duration: 4000,
        });
        localStorage.setItem("due-date-toast-shown", "true");
      }
    } catch {
      // localStorage 접근 불가 시 무시 (시크릿 모드 등)
    }
  }, [hydrated, dueDate]);

  const currentWeek = useMemo(() => {
    if (!hydrated || !dueDate) return null;
    return calcPregnancyWeek(new Date(dueDate));
  }, [hydrated, dueDate]);

  const allChecklistItems = useMemo(
    () => [...(checklistItems as ChecklistItem[]), ...customItems],
    [customItems]
  );

  const progress = useMemo(() => {
    const total = allChecklistItems.length;
    const checked = allChecklistItems.filter((i) => checkedIds.includes(i.id)).length;
    return { total, checked, percent: total > 0 ? (checked / total) * 100 : 0 };
  }, [allChecklistItems, checkedIds]);

  const thisWeekChecklist = useMemo(() => {
    if (!currentWeek) return [];
    const allTimeline = [...(timelineItems as TimelineItem[]), ...customTimelineItems];
    const weekMap = getChecklistByWeek(allTimeline, checklistItems as ChecklistItem[], customItems);
    // 현재 주차 ± 1 범위의 체크리스트 수집
    const result: ChecklistItem[] = [];
    for (const [week, items] of weekMap) {
      if (Math.abs(week - currentWeek) <= 1) {
        result.push(...items);
      }
    }
    return result;
  }, [currentWeek, customTimelineItems, customItems]);

  const thisWeekUnchecked = useMemo(() => {
    return thisWeekChecklist.filter((item) => !checkedIds.includes(item.id));
  }, [thisWeekChecklist, checkedIds]);

  const daysLeft = useMemo(() => {
    if (!dueDate) return null;
    const diff = Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) / 86400000
    );
    return Math.max(0, diff);
  }, [dueDate]);

  const hasDueDate = hydrated && dueDate;

  // Mini dashboard data
  const upcomingFairs = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return babyfairEvents
      .filter((e) => e.end_date >= today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
  }, []);

  const videoCategories = useMemo(() => {
    const cats = new Set(videosData.map((v) => v.categoryName));
    return cats.size;
  }, []);

  const latestWeight = useMemo(() => {
    if (!hydrated || weightLogs.length === 0) return null;
    const sorted = [...weightLogs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latest = sorted[0];
    const first = sorted[sorted.length - 1];
    const diff = sorted.length > 1 ? latest.weight - first.weight : null;
    return { weight: latest.weight, diff };
  }, [hydrated, weightLogs]);

  const latestArticle = articles.length > 0 ? articles[0] : null;

  if (showOnboarding) {
    return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <div className="min-h-screen pb-24 px-4">
      {/* Hero Section */}
      <div className="pt-14 pb-8 text-center">
        <div className="mb-8 relative">
          <div className="w-24 h-24 mx-auto rounded-full bg-linear-to-br from-[#FFD4DE] via-[#E4D6F0] to-[#D0EDE2] flex items-center justify-center shadow-lg overflow-hidden">
            <Image src="/home.png" alt="출산 준비" width={96} height={96} className="object-cover" />
          </div>
        </div>
        <h1 className="mb-3">출산 준비 체크리스트</h1>
        <p className="text-muted-foreground">소중한 아기를 위한 완벽한 준비</p>
        <div className="mt-6 mx-auto w-12 h-0.5 rounded-full bg-linear-to-r from-[#FFD4DE] to-[#E4D6F0]" />
      </div>

      {/* Due Date Card */}
      <div className="mb-8">
        <DueDateInput />
      </div>

      {/* Dashboard (예정일 입력 시) */}
      {hasDueDate && (
        <div className="space-y-4 mb-8">
          {/* 재방문 유저 웰컴 메시지 */}
          {returningMessage && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#E4D6F0]/20 border border-[#E4D6F0]/30">
              <Sparkles size={16} className="text-[#6B5A80] shrink-0" />
              <span className="text-sm text-[#6B5A80]">{returningMessage}</span>
            </div>
          )}

          {/* Week & Days Left */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="rounded-2xl border border-black/4">
              <CardContent className="p-4 text-center">
                <span className="text-sm text-muted-foreground">현재</span>
                <div className="text-2xl mt-1">
                  <strong>{currentWeek}주</strong>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-black/4">
              <CardContent className="p-4 text-center">
                <span className="text-sm text-muted-foreground">D-day</span>
                <div className="text-2xl mt-1">
                  <strong>{daysLeft}</strong>
                  <span className="text-base text-muted-foreground">일</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checklist Progress */}
          <Link href="/timeline" className="no-underline block">
            <Card className="rounded-2xl border border-black/4 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">체크리스트 진행률</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm tabular-nums">
                      <strong>{hydrated ? progress.checked : 0}</strong>/{progress.total}
                    </span>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </div>
                <Progress value={hydrated ? progress.percent : 0} className="h-2 bg-muted" />
              </CardContent>
            </Card>
          </Link>

          {/* This Week Checklist CTA */}
          {thisWeekChecklist.length > 0 && (
            <Card className="rounded-2xl border border-black/4">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3">
                  🗓️ {currentWeek}주차에 {thisWeekUnchecked.length > 0 ? `${thisWeekUnchecked.length}가지 할 일이 남았어요` : "모든 할 일을 완료했어요!"}
                </p>
                <div className="space-y-2 mb-4">
                  {thisWeekChecklist.slice(0, 3).map((item) => {
                    const isChecked = checkedIds.includes(item.id);
                    return (
                      <div key={item.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={isChecked}
                          className="size-4 rounded border-2 data-[state=checked]:bg-[#D0EDE2] data-[state=checked]:border-[#D0EDE2] data-[state=checked]:text-[#3D4447] border-gray-200 pointer-events-none"
                          tabIndex={-1}
                          aria-hidden
                        />
                        <span className={`text-sm truncate ${isChecked ? "line-through text-muted-foreground" : ""}`}>
                          {item.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <Link href="/timeline" className="no-underline block">
                  <Button
                    className="w-full h-10 rounded-xl bg-[#E4D6F0] text-[#3D4447] hover:bg-[#E4D6F0]/80"
                    aria-label="타임라인에서 확인하기"
                  >
                    타임라인에서 확인하기 →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 예정일 미입력 시 안내 */}
      {hydrated && !dueDate && (
        <div className="mb-8 text-center">
          <Card className="rounded-2xl border border-[#FFF4D4]/50 bg-[#FFF4D4]/10">
            <CardContent className="p-6">
              <p className="text-sm text-[#8B7520]">
                예정일을 입력하면 나에게 맞는 체크리스트와 타임라인을 볼 수 있어요
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mini Dashboard Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Baby Fair Card */}
        <DashboardCard
          icon="👶"
          title="베이비페어"
          href="/baby-fair"
          color="#D0EDE2"
          cta="일정 보기"
        >
          {upcomingFairs.length > 0 ? (
            <>
              <p className="text-sm font-medium">다가오는 행사</p>
              <p className="text-lg font-semibold">{upcomingFairs.length}건</p>
              <p className="text-xs text-muted-foreground truncate">
                {upcomingFairs[0].name} {upcomingFairs[0].start_date.slice(5)}~
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              예정된 베이비페어가 없습니다
            </p>
          )}
        </DashboardCard>

        {/* Weight Card */}
        <DashboardCard
          icon="⚖️"
          title="체중 기록"
          href="/weight"
          color="#FFE0CC"
          cta={latestWeight ? "기록하기" : "시작하기"}
        >
          {latestWeight ? (
            <>
              <p className="text-xs text-muted-foreground">최근</p>
              <p className="text-lg font-semibold">{latestWeight.weight}kg</p>
              {latestWeight.diff !== null && (
                <p className="text-xs text-muted-foreground">
                  {latestWeight.diff >= 0 ? "+" : ""}
                  {latestWeight.diff.toFixed(1)}kg from 시작
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              체중 변화를 기록하고 추이를 확인하세요
            </p>
          )}
        </DashboardCard>

        {/* Video Card */}
        <DashboardCard
          icon="🎬"
          title="영상"
          href="/videos"
          color="#FFF4D4"
          cta="보러가기"
        >
          <p className="text-xs text-muted-foreground">추천 영상</p>
          <p className="text-lg font-semibold">{videosData.length}건</p>
          <p className="text-xs text-muted-foreground">
            {videoCategories}개 카테고리
          </p>
        </DashboardCard>

        {/* Articles Card */}
        <DashboardCard
          icon="📝"
          title="정보 & 가이드"
          href="/articles"
          color="#E0F0FF"
          cta="읽으러 가기"
        >
          {latestArticle ? (
            <>
              <p className="text-xs text-muted-foreground">새 글</p>
              <p className="text-sm font-medium truncate">
                {latestArticle.title}
              </p>
              <p className="text-xs text-muted-foreground">
                총 {articles.length}개 아티클
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              임신·출산 가이드를 확인하세요
            </p>
          )}
        </DashboardCard>
      </div>

      {/* Motivational Text */}
      <div className="mt-10 text-center">
        <p className="text-muted-foreground text-sm">
          출산은 인생에서 가장 특별한 순간입니다
        </p>
      </div>

      {/* Feedback Banner */}
      {process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL && (
        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-xs">
            더 나은 서비스를 위해{" "}
            <a
              href={process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-[#6B5A80] hover:text-[#6B5A80]/80"
            >
              의견을 들려주세요
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
