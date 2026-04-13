import type { Metadata } from "next";
import timelineItems from "@/data/timeline_items.json";
import checklistItems from "@/data/checklist_items.json";
import type { TimelineItem } from "@/types/timeline";
import type { ChecklistItem } from "@/types/checklist";
import { TimelineContainer } from "@/components/timeline/TimelineContainer";
import { DueDateBanner } from "@/components/home/DueDateBanner";
import { BASE_URL } from "@/lib/constants";
import { getAllArticles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "임신 주차별 타임라인 & 체크리스트 - 출산 준비 체크리스트",
  description: "주차별로 뭘 해야 하는지 한눈에. 직접 써보며 만든 체크리스트.",
  alternates: {
    canonical: `${BASE_URL}/timeline`,
  },
  openGraph: {
    title: "임신 주차별 타임라인 & 체크리스트",
    description: "주차별로 뭘 해야 하는지 한눈에. 직접 써보며 만든 체크리스트.",
    url: `${BASE_URL}/timeline`,
  },
};

export default function TimelinePage() {
  const articles = getAllArticles();

  return (
    <>
      <div className="px-4 pt-8">
        <DueDateBanner />
      </div>
      <TimelineContainer
        timelineItems={timelineItems as TimelineItem[]}
        checklistItems={checklistItems as ChecklistItem[]}
        articles={articles}
      />
    </>
  );
}
