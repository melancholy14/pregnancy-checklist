"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTimelineStore } from "@/store/useTimelineStore";

interface TimelineAddFormProps {
  onClose: () => void;
}

export function TimelineAddForm({ onClose }: TimelineAddFormProps) {
  const { addCustomItem } = useTimelineStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [week, setWeek] = useState(12);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addCustomItem({
      id: `custom-timeline-${Date.now()}`,
      week,
      title: title.trim(),
      description: description.trim(),
      type: "prep",
      priority: "medium",
      isCustom: true,
    });

    setTitle("");
    setDescription("");
    onClose();
  };

  return (
    <Card className="rounded-2xl shadow-md mb-6 border border-[#E4D6F0]/30 bg-[#E4D6F0]/5">
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">주차 (1~40)</label>
            <input
              type="number"
              min={1}
              max={40}
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E4D6F0]/50"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="할 일을 입력하세요"
              className="w-full px-3 py-2 rounded-xl border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E4D6F0]/50"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">설명 (선택)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상세 설명을 입력하세요"
              className="w-full px-3 py-2 rounded-xl border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E4D6F0]/50"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="rounded-xl">
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!title.trim()}
              className="rounded-xl bg-[#E4D6F0] text-[#3D4447] hover:bg-[#E4D6F0]/80"
            >
              추가
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
