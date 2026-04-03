"use client";

import { useState } from "react";
import { ChevronDown, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTimelineStore } from "@/store/useTimelineStore";
import type { TimelineItem } from "@/types/timeline";
import type { ChecklistItem } from "@/types/checklist";
import { WeekChecklistSection } from "./WeekChecklistSection";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

const TYPE_COLORS: Record<string, string> = {
  prep: "#FFD4DE",
  shopping: "#FFE0CC",
  admin: "#FFF4D4",
  education: "#E4D6F0",
  wellbeing: "#D0EDE2",
};

interface TimelineAccordionCardProps {
  item: TimelineItem;
  status: "past" | "current" | "future";
  checklistItems: ChecklistItem[];
  checkedIds: string[];
  defaultOpen?: boolean;
}

export function TimelineAccordionCard({
  item,
  status,
  checklistItems,
  checkedIds,
  defaultOpen = false,
}: TimelineAccordionCardProps) {
  const { removeCustomItem, updateCustomItem } = useTimelineStore();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDescription, setEditDescription] = useState(item.description);
  const [editWeek, setEditWeek] = useState(item.week);

  const color = TYPE_COLORS[item.type] ?? "#E4D6F0";
  const hasChecklist = checklistItems.length > 0;
  const checkedCount = checklistItems.filter((c) => checkedIds.includes(c.id)).length;
  const totalCount = checklistItems.length;

  const saveEdit = () => {
    if (!editTitle.trim()) return;
    updateCustomItem(item.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      week: editWeek,
    });
    setIsEditing(false);
  };

  return (
    <div className={`relative pl-20 ${status === "past" ? "opacity-60" : ""}`} id={`timeline-week-${item.week}`}>
      {/* Week circle */}
      <div
        className={`absolute left-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-black/4 transition-all ${
          status === "current" ? "scale-110 ring-4 ring-white shadow-md" : ""
        }`}
        style={{ backgroundColor: color }}
      >
        <span className="text-sm font-semibold text-[#3D4447]">{item.week}주</span>
      </div>

      {/* Card with Collapsible */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card
          className={`rounded-xl shadow-sm transition-all border ${
            status === "current"
              ? "ring-2 ring-offset-2 border-black/4"
              : "border-black/4"
          }`}
          style={status === "current" ? ({ "--tw-ring-color": color } as React.CSSProperties) : {}}
        >
          <CardContent className="p-0">
            {/* Header: always visible */}
            {isEditing ? (
              <div className="p-4 space-y-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">주차</label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={editWeek}
                    onChange={(e) => setEditWeek(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E4D6F0]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">제목</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E4D6F0]/50"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">설명</label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E4D6F0]/50"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-lg h-8 text-xs">
                    취소
                  </Button>
                  <Button type="button" size="sm" onClick={saveEdit} disabled={!editTitle.trim()} className="rounded-lg h-8 text-xs bg-[#E4D6F0] text-[#3D4447] hover:bg-[#E4D6F0]/80">
                    저장
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2 p-4">
                <CollapsibleTrigger asChild disabled={!hasChecklist}>
                  <button
                    className={`flex-1 text-left ${hasChecklist ? "cursor-pointer" : "cursor-default"}`}
                    type="button"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[15px] font-medium">{item.title}</h3>
                      {item.isCustom && (
                        <Badge className="bg-[#E4D6F0]/40 text-[#6B5A80] text-[10px] px-1.5 py-0 rounded border-0 hover:bg-[#E4D6F0]/40">
                          내 항목
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                    {/* 체크리스트 요약 */}
                    {hasChecklist && (
                      <div className="flex items-center gap-2 mt-2">
                        <ChevronDown
                          size={14}
                          className={`text-muted-foreground transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                        <span className="text-xs text-muted-foreground">
                          체크리스트 {totalCount}개
                          {checkedCount > 0 && (
                            <span className="ml-1 text-[#2D6B4F]">
                              ({checkedCount}/{totalCount} 완료)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {!hasChecklist && (
                      <p className="text-xs text-muted-foreground mt-2">준비 항목 없음</p>
                    )}
                  </button>
                </CollapsibleTrigger>
                {item.isCustom && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1 rounded-lg text-[#9CA0A4] hover:text-[#6B5A80] hover:bg-[#E4D6F0]/20 transition-colors"
                      aria-label="수정"
                    >
                      <Pencil size={14} />
                    </button>
                    <DeleteConfirmDialog onConfirm={() => removeCustomItem(item.id)} />
                  </div>
                )}
              </div>
            )}

            {/* Expandable checklist */}
            {hasChecklist && !isEditing && (
              <CollapsibleContent>
                <div className="border-t border-black/4 px-4">
                  <WeekChecklistSection items={checklistItems} checkedIds={checkedIds} />
                </div>
              </CollapsibleContent>
            )}
          </CardContent>
        </Card>
      </Collapsible>
    </div>
  );
}
