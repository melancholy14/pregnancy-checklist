"use client";

import { useState, useEffect } from "react";
import { ListChecks, Clock, Users, Scale, Video } from "lucide-react";
import Link from "next/link";
import { useDueDateStore } from "@/store/useDueDateStore";
import { calcPregnancyWeek } from "@/lib/week-calculator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { dueDate, setDueDate } = useDueDateStore();
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setDueDate(date);
  };

  const features = [
    { icon: ListChecks, label: "체크리스트", color: "#FFD6E0", path: "/checklist" },
    { icon: Clock, label: "타임라인", color: "#E8D5F5", path: "/timeline" },
    { icon: Users, label: "베이비페어", color: "#D5F0E8", path: "/baby-fair" },
    { icon: Scale, label: "체중 기록", color: "#FFE8D0", path: "/weight" },
    { icon: Video, label: "영상", color: "#FFF8D0", path: "/videos" },
  ];

  return (
    <div className="min-h-screen pb-24 px-4">
      {/* Hero Section */}
      <div className="pt-12 pb-8 text-center">
        <div className="mb-6 relative">
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-[#FFD6E0] via-[#E8D5F5] to-[#D5F0E8] flex items-center justify-center">
            <div className="text-6xl">🤰</div>
          </div>
        </div>
        <h1 className="mb-2">출산 준비 체크리스트</h1>
        <p className="text-gray-500">소중한 아기를 위한 완벽한 준비</p>
      </div>

      {/* Due Date Card */}
      <div className="max-w-md mx-auto mb-8">
        <Card className="rounded-3xl shadow-lg border-0">
          <CardContent className="p-6">
            <label className="block mb-3 text-center">출산 예정일을 입력하세요</label>
            <input
              type="date"
              value={hydrated ? (dueDate ?? "") : ""}
              onChange={handleDateChange}
              className="w-full px-4 py-3 bg-gray-50 rounded-full border-0 text-center"
            />
            {hydrated && currentWeek !== null && (
              <div className="mt-4 text-center">
                <Badge className="bg-[#FFD6E0] text-[#4A4A4A] px-6 py-3 rounded-full text-lg border-0 hover:bg-[#FFD6E0]">
                  현재 임신 <strong>{currentWeek}주</strong>
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Grid */}
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.label}
                href={feature.path}
                className="no-underline"
              >
                <Card className="rounded-3xl shadow-md hover:shadow-xl transition-all border-0 h-full">
                  <CardContent className="p-6 flex flex-col items-center gap-3 group">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: feature.color }}
                    >
                      <Icon size={28} strokeWidth={2} color="#4A4A4A" />
                    </div>
                    <span className="text-center">{feature.label}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Motivational Text */}
      <div className="max-w-md mx-auto mt-8 text-center">
        <p className="text-gray-400 text-sm">
          출산은 인생에서 가장 특별한 순간입니다<br />
          함께 준비해요! 💕
        </p>
      </div>
    </div>
  );
}
