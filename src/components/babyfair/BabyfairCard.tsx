"use client";

import { useState } from "react";
import { MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { BabyfairEvent } from "@/types/babyfair";

const CITY_COLORS: Record<string, string> = {
  서울: "#FFD4DE",
  부산: "#E4D6F0",
  대구: "#D0EDE2",
  인천: "#FFE0CC",
  경기: "#FFF4D4",
  광주: "#FFD4DE",
  대전: "#D0EDE2",
};

function formatDateRange(startDate: string, endDate: string): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const startStr = format(start, "yyyy년 M월 d일", { locale: ko });
  const endStr = format(end, "d일", { locale: ko });
  return `${startStr}-${endStr}`;
}

interface BabyfairCardProps {
  event: BabyfairEvent;
}

export function BabyfairCard({ event }: BabyfairCardProps) {
  const color = CITY_COLORS[event.city] ?? "#FFD4DE";
  const [open, setOpen] = useState(false);
  const hasUrl = !!event.official_url;

  const handleCardClick = () => {
    if (hasUrl) setOpen(true);
  };

  const handleConfirm = () => {
    const newWindow = window.open(event.official_url, "_blank");
    if (newWindow) {
      newWindow.opener = null;
    } else {
      toast("팝업이 차단되었습니다", {
        description: "브라우저 설정에서 팝업을 허용해주세요",
      });
    }
    setOpen(false);
  };

  return (
    <>
      <Card
        className={`rounded-2xl shadow-sm transition-all duration-300 border border-black/4 group ${hasUrl ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5" : ""}`}
        onClick={handleCardClick}
        {...(hasUrl && {
          role: "button",
          tabIndex: 0,
          "aria-label": `${event.name} 공식 홈페이지 열기`,
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCardClick();
            }
          },
        })}
      >
        <CardContent className="p-6">
          {/* City Badge */}
          <div className="flex justify-between items-start mb-4">
            <Badge
              className="rounded-lg text-sm border border-black/4 px-3 py-1 text-[#3D4447] font-medium"
              style={{ backgroundColor: color }}
            >
              {event.city}
            </Badge>
          </div>

          {/* Event Name */}
          <h3 className="mb-3 group-hover:text-muted-foreground transition-colors">
            {event.name}
          </h3>

          {/* Dates */}
          <div className="flex items-start gap-2 mb-2 text-sm text-muted-foreground">
            <Calendar size={15} className="mt-0.5 shrink-0" />
            <span>{formatDateRange(event.start_date, event.end_date)}</span>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin size={15} className="mt-0.5 shrink-0" />
            <span>{event.venue_name}</span>
          </div>

          {/* Decorative Element */}
          <div className="mt-4 pt-4 border-t border-black/4 text-xs text-muted-foreground">
            입장료, 주차, 혜택 등은 공식 홈페이지 참고
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">{event.name}</AlertDialogTitle>
            <AlertDialogDescription>공식 홈페이지로 이동합니다</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-sm">취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="rounded-xl text-sm bg-[#6B5A80] hover:bg-[#6B5A80]/90 text-white"
            >
              이동
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
