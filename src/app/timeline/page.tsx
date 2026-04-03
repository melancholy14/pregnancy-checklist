import type { Metadata } from "next";
import timelineItems from "@/data/timeline_items.json";
import checklistItems from "@/data/checklist_items.json";
import type { TimelineItem } from "@/types/timeline";
import type { ChecklistItem } from "@/types/checklist";
import { TimelineContainer } from "@/components/timeline/TimelineContainer";
import { DueDateBanner } from "@/components/home/DueDateBanner";

export const metadata: Metadata = {
  title: "임신 주차별 타임라인 & 체크리스트 - 출산 준비 체크리스트",
  description: "4주부터 40주까지, 주차별로 준비해야 할 항목을 체크리스트와 함께 확인하세요.",
};

export default function TimelinePage() {
  return (
    <>
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <DueDateBanner />
      </div>
      <TimelineContainer
        timelineItems={timelineItems as TimelineItem[]}
        checklistItems={checklistItems as ChecklistItem[]}
      />
    </>
  );
}
