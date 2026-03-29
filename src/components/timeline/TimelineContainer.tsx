"use client";

import { useEffect, useState } from "react";
import { Calendar, Baby, Heart, Package, FileText } from "lucide-react";
import { useDueDateStore } from "@/store/useDueDateStore";
import { useTimelineStore } from "@/store/useTimelineStore";
import { calcPregnancyWeek } from "@/lib/week-calculator";
import { Card, CardContent } from "@/components/ui/card";
import type { TimelineItem } from "@/types/timeline";
import { TimelineCard } from "./TimelineCard";

interface Milestone {
  week: number;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  color: string;
  title: string;
  tasks: string[];
}

const milestones: Milestone[] = [
  {
    week: 12,
    icon: Heart,
    color: "#FFD6E0",
    title: "초기 검진",
    tasks: ["산부인과 첫 방문", "기본 혈액 검사", "초음파 검사"],
  },
  {
    week: 20,
    icon: Baby,
    color: "#E8D5F5",
    title: "중기 검사",
    tasks: ["정밀 초음파", "성별 확인 가능", "태동 느끼기 시작"],
  },
  {
    week: 28,
    icon: Calendar,
    color: "#D5F0E8",
    title: "후기 준비",
    tasks: ["임신성 당뇨 검사", "출산 교육 수강", "산후조리원 예약"],
  },
  {
    week: 32,
    icon: Package,
    color: "#FFE8D0",
    title: "출산 준비",
    tasks: ["출산 가방 준비", "신생아 용품 구매", "카시트 설치"],
  },
  {
    week: 36,
    icon: FileText,
    color: "#FFF8D0",
    title: "최종 점검",
    tasks: ["매주 검진", "출산 계획 확정", "긴급 연락망 정리"],
  },
];

interface TimelineContainerProps {
  items: TimelineItem[];
}

export function TimelineContainer({ items }: TimelineContainerProps) {
  const { dueDate } = useDueDateStore();
  const { customItems } = useTimelineStore();
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && dueDate) {
      setCurrentWeek(calcPregnancyWeek(new Date(dueDate)));
    }
  }, [hydrated, dueDate]);

  return (
    <div className="min-h-screen pb-24 px-4 bg-gradient-to-b from-[#FFF8F5] to-white">
      <div className="max-w-2xl mx-auto pt-8">
        <h1 className="mb-2 text-center">임신 타임라인</h1>
        <p className="text-center text-gray-500 mb-8">
          주차별 중요한 순간들을 확인하세요
        </p>

        {hydrated && currentWeek !== null && (
          <Card className="rounded-3xl shadow-md mb-8 border-0">
            <CardContent className="p-4 text-center">
              <span className="text-sm text-gray-500">현재</span>
              <div className="text-2xl mt-1">
                <strong>{currentWeek}주</strong>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-[#FFD6E0] via-[#E8D5F5] to-[#FFF8D0]" />

          <div className="space-y-8">
            {milestones.map((milestone) => {
              const isCurrent =
                currentWeek != null &&
                currentWeek >= milestone.week - 2 &&
                currentWeek <= milestone.week + 2;

              return (
                <TimelineCard
                  key={milestone.week}
                  milestone={milestone}
                  isCurrent={isCurrent}
                />
              );
            })}
          </div>
        </div>

        {/* Final Message */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-gradient-to-r from-[#FFD6E0] to-[#E8D5F5] rounded-full px-8 py-4 shadow-lg">
            <div className="text-4xl mb-2">👶</div>
            <div className="text-sm text-gray-700">
              40주차: 소중한 아기와의 만남!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
