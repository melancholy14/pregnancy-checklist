import timelineItems from "@/data/timeline_items.json";
import checklistItems from "@/data/checklist_items.json";
import type { TimelineItem } from "@/types/timeline";
import type { ChecklistItem } from "@/types/checklist";
import { TimelineContainer } from "@/components/timeline/TimelineContainer";
import { DueDateBanner } from "@/components/home/DueDateBanner";

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
