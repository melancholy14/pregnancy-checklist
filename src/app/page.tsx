"use client";

import { ListChecks, Clock, Users, Scale, Video } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { DueDateInput } from "@/components/home/DueDateInput";

const features = [
  { icon: ListChecks, label: "체크리스트", color: "#F0C8D2", path: "/checklist" },
  { icon: Clock, label: "타임라인", color: "#D4C4E4", path: "/timeline" },
  { icon: Users, label: "베이비페어", color: "#C0DCD0", path: "/baby-fair" },
  { icon: Scale, label: "체중 기록", color: "#ECD2BE", path: "/weight" },
  { icon: Video, label: "영상", color: "#E8E2C6", path: "/videos" },
];

export default function Home() {
  return (
    <div className="min-h-screen pb-24 px-4">
      {/* Hero Section */}
      <div className="pt-14 pb-10 text-center">
        <div className="mb-8 relative">
          <div className="w-24 h-24 mx-auto rounded-full bg-linear-to-br from-[#F0C8D2] via-[#D4C4E4] to-[#C0DCD0] flex items-center justify-center shadow-lg">
            <div className="text-5xl">🤰</div>
          </div>
        </div>
        <h1 className="mb-3">출산 준비 체크리스트</h1>
        <p className="text-muted-foreground">소중한 아기를 위한 완벽한 준비</p>
        <div className="mt-6 mx-auto w-12 h-0.5 rounded-full bg-linear-to-r from-[#F0C8D2] to-[#D4C4E4]" />
      </div>

      {/* Due Date Card */}
      <div className="max-w-md mx-auto mb-8">
        <DueDateInput />
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
                <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-black/4 h-full hover:-translate-y-0.5">
                  <CardContent className="p-6 flex flex-col items-center gap-3 group">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
                      style={{ backgroundColor: feature.color }}
                    >
                      <Icon size={24} strokeWidth={1.8} color="#2D3436" />
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
    </div>
  );
}
