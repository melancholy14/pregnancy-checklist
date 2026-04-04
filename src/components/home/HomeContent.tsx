"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Users, Scale, Video, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DueDateInput } from "@/components/home/DueDateInput";
import { useDueDateStore } from "@/store/useDueDateStore";
import { useChecklistStore } from "@/store/useChecklistStore";
import { useTimelineStore } from "@/store/useTimelineStore";
import { calcPregnancyWeek } from "@/lib/week-calculator";
import checklistItems from "@/data/checklist_items.json";
import timelineItems from "@/data/timeline_items.json";
import type { ChecklistItem } from "@/types/checklist";
import type { TimelineItem } from "@/types/timeline";

const features = [
  { icon: Clock, label: "타임라인", color: "#E4D6F0", path: "/timeline" },
  { icon: Users, label: "베이비페어", color: "#D0EDE2", path: "/baby-fair" },
  { icon: Scale, label: "체중 기록", color: "#FFE0CC", path: "/weight" },
  { icon: Video, label: "영상", color: "#FFF4D4", path: "/videos" },
];

export function HomeContent() {
  const { dueDate } = useDueDateStore();
  const { checkedIds, customItems } = useChecklistStore();
  const { customItems: customTimelineItems } = useTimelineStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
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

  const thisWeekTimeline = useMemo(() => {
    if (!currentWeek) return [];
    const allTimeline = [...(timelineItems as TimelineItem[]), ...customTimelineItems];
    return allTimeline.filter(
      (item) => Math.abs(item.week - currentWeek) <= 1
    );
  }, [currentWeek, customTimelineItems]);

  const daysLeft = useMemo(() => {
    if (!dueDate) return null;
    const diff = Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) / 86400000
    );
    return Math.max(0, diff);
  }, [dueDate]);

  const hasDueDate = hydrated && dueDate;

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
      <div className="max-w-md mx-auto mb-8">
        <DueDateInput />
      </div>

      {/* Dashboard (예정일 입력 시) */}
      {hasDueDate && (
        <div className="max-w-md mx-auto space-y-4 mb-8">
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

          {/* This Week Timeline */}
          {thisWeekTimeline.length > 0 && (
            <Link href="/timeline" className="no-underline block">
              <Card className="rounded-2xl border border-black/4 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-muted-foreground">이번 주 할 일</span>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    {thisWeekTimeline.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E4D6F0] shrink-0" />
                        <span className="text-sm truncate">{item.title}</span>
                        <Badge className="bg-[#E4D6F0]/40 text-[#6B5A80] text-[10px] px-1.5 py-0 rounded border-0 hover:bg-[#E4D6F0]/40 shrink-0">
                          {item.week}주
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      )}

      {/* 예정일 미입력 시 안내 */}
      {hydrated && !dueDate && (
        <div className="max-w-md mx-auto mb-8 text-center">
          <Card className="rounded-2xl border border-[#FFF4D4]/50 bg-[#FFF4D4]/10">
            <CardContent className="p-6">
              <p className="text-sm text-[#8B7520]">
                예정일을 입력하면 나에게 맞는 체크리스트와 타임라인을 볼 수 있어요
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feature Grid */}
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.label} href={feature.path} className="no-underline">
                <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-black/4 h-full hover:-translate-y-0.5">
                  <CardContent className="p-6 flex flex-col items-center gap-3 group">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
                      style={{ backgroundColor: feature.color }}
                    >
                      <Icon size={24} strokeWidth={1.8} color="#3D4447" />
                    </div>
                    <span className="text-center text-sm font-medium">{feature.label}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Motivational Text */}
      <div className="max-w-md mx-auto mt-10 text-center">
        <p className="text-muted-foreground text-sm">
          출산은 인생에서 가장 특별한 순간입니다
        </p>
      </div>

      {/* Feedback Banner */}
      {process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL && (
        <div className="max-w-md mx-auto mt-6 text-center">
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
