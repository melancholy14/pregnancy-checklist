"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";

interface TimelineCTAProps {
  weeks: number[];
}

export function TimelineCTA({ weeks }: TimelineCTAProps) {
  if (weeks.length === 0) return null;

  const weeksText = weeks.map((w) => `${w}주차`).join(", ");
  const firstWeek = Math.min(...weeks);

  return (
    <div className="mt-10 rounded-2xl border border-[#E4D6F0]/40 bg-[#E4D6F0]/10 p-5">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-xl bg-[#E4D6F0] flex items-center justify-center shrink-0 mt-0.5">
          <Calendar size={18} strokeWidth={1.8} className="text-[#3D4447]" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">타임라인에서 체크하기</p>
          <p className="text-xs text-muted-foreground mb-3">
            이 내용은 {weeksText} 할일에 있어요
          </p>
          <Link
            href={`/timeline#timeline-week-${firstWeek}`}
            className="inline-flex items-center gap-1 text-sm text-[#6B5A80] hover:text-[#4A3D5C] font-medium no-underline"
          >
            타임라인 보기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
