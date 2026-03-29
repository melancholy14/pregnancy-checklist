import timelineItems from "@/data/timeline_items.json";
import type { TimelineItem } from "@/types/timeline";
import { TimelineContainer } from "@/components/timeline/TimelineContainer";

export default function TimelinePage() {
  return <TimelineContainer items={timelineItems as TimelineItem[]} />;
}
