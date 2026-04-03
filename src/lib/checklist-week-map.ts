import type { ChecklistItem } from "@/types/checklist";
import type { TimelineItem } from "@/types/timeline";

/**
 * 타임라인 주차별로 체크리스트를 그룹핑한다.
 * 1) linked_checklist_ids 우선 매핑
 * 2) recommendedWeek 기반 나머지 매핑
 * recommendedWeek === 0인 항목은 매핑하지 않는다 (기타 섹션에서 별도 처리).
 */
export function getChecklistByWeek(
  timelineItems: TimelineItem[],
  checklistItems: ChecklistItem[],
  customChecklistItems: ChecklistItem[]
): Map<number, ChecklistItem[]> {
  const allChecklist = [...checklistItems, ...customChecklistItems];
  const weekMap = new Map<number, ChecklistItem[]>();

  // linked_checklist_ids로 이미 배정된 항목 ID를 추적
  const assignedIds = new Set<string>();

  // 1) linked_checklist_ids가 있으면 우선 사용
  for (const timeline of timelineItems) {
    if (timeline.linked_checklist_ids?.length) {
      const linked = allChecklist.filter((c) =>
        timeline.linked_checklist_ids!.includes(c.id)
      );
      const existing = weekMap.get(timeline.week) ?? [];
      weekMap.set(timeline.week, [...existing, ...linked]);
      for (const item of linked) {
        assignedIds.add(item.id);
      }
    }
  }

  // 2) recommendedWeek 기반으로 나머지 매핑 (이미 linked로 배정된 항목은 건너뜀)
  for (const item of allChecklist) {
    if (item.recommendedWeek === 0) continue;
    if (assignedIds.has(item.id)) continue;
    const weekItems = weekMap.get(item.recommendedWeek) ?? [];
    if (!weekItems.find((w) => w.id === item.id)) {
      weekMap.set(item.recommendedWeek, [...weekItems, item]);
    }
  }

  return weekMap;
}

/**
 * recommendedWeek === 0인 커스텀 항목을 반환한다.
 */
export function getUnassignedChecklist(
  customChecklistItems: ChecklistItem[]
): ChecklistItem[] {
  return customChecklistItems.filter((item) => item.recommendedWeek === 0);
}
