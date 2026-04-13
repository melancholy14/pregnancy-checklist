"use client";

import { useState } from "react";
import { MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";
import { sendGAEvent } from "@/lib/analytics";
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

const SCALE_CONFIG: Record<string, { label: string; color: string }> = {
  large: { label: "대형", color: "#FFD4DE" },
  medium: { label: "중형", color: "#FFF4D4" },
  small: { label: "소형", color: "#E0F0FF" },
};

const CITY_COLORS: Record<string, string> = {
  서울: "#FFD4DE",
  "서울(마곡)": "#FFD4DE",
  부산: "#E4D6F0",
  대구: "#D0EDE2",
  인천: "#FFE0CC",
  경기: "#FFF4D4",
  광주: "#FFD4DE",
  대전: "#D0EDE2",
  수원: "#FFF4D4",
  "수원(광교)": "#FFF4D4",
  "고양(일산)": "#FFE0CC",
  청주: "#E4D6F0",
  창원: "#D0EDE2",
  김해: "#E4D6F0",
  경주: "#FFE0CC",
  강릉: "#D0EDE2",
  익산: "#FFF4D4",
  순천: "#FFD4DE",
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
  daysLeft?: number;
}

export function BabyfairCard({ event, daysLeft }: BabyfairCardProps) {
  const color = CITY_COLORS[event.city] ?? "#FFD4DE";
  const [open, setOpen] = useState(false);
  const hasUrl = !!event.official_url;

  const handleCardClick = () => {
    if (hasUrl) setOpen(true);
  };

  const handleConfirm = () => {
    sendGAEvent("outbound_click", { url: event.official_url, event_name: event.name });
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
          {/* City Badge + Scale Badge + D-day */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {event.scale && SCALE_CONFIG[event.scale] && (
                <Badge
                  className="rounded-md text-xs border-0 px-2 py-1 text-foreground font-medium"
                  style={{ backgroundColor: SCALE_CONFIG[event.scale].color }}
                >
                  {SCALE_CONFIG[event.scale].label}
                </Badge>
              )}
              <Badge
                className="rounded-md text-sm border border-black/4 px-3 py-1 text-foreground font-medium"
                style={{ backgroundColor: color }}
              >
                {event.city}
              </Badge>
              {daysLeft !== undefined && (
                <Badge className="rounded-md text-xs border-0 px-2 py-1 bg-pastel-mint text-accent-green font-medium">
                  {daysLeft === 0 ? "D-Day" : `D-${daysLeft}일 남음`}
                </Badge>
              )}
            </div>
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

          {/* Extended Info */}
          {(event.operating_hours || event.admission || event.parking) && (
            <div className="mt-3 space-y-1.5">
              {event.operating_hours && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span aria-hidden="true" className="shrink-0">🕐</span>
                  <span>{event.operating_hours}</span>
                </div>
              )}
              {event.admission && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span aria-hidden="true" className="shrink-0">🎟️</span>
                  <span>{event.admission}</span>
                </div>
              )}
              {event.parking && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span aria-hidden="true" className="shrink-0">🅿️</span>
                  <span>{event.parking}</span>
                </div>
              )}
            </div>
          )}

          {/* Highlights */}
          {event.highlights && event.highlights.length > 0 && (
            <ul className="mt-3 space-y-1">
              {event.highlights.slice(0, 3).map((h) => (
                <li key={h} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="mt-1 shrink-0 w-1 h-1 rounded-full bg-muted-foreground/50" />
                  {h}
                </li>
              ))}
              {event.highlights.length > 3 && (
                <li className="text-xs text-muted-foreground">외 {event.highlights.length - 3}개</li>
              )}
            </ul>
          )}

          {/* Tip */}
          {event.tip && (
            <div className="mt-3 p-3 rounded-lg bg-pastel-yellow/20 text-xs text-muted-foreground leading-relaxed">
              <span aria-hidden="true">💬</span> {event.tip}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-black/4 text-xs text-muted-foreground">
            {event.admission || event.parking
              ? "상세 정보는 공식 홈페이지에서 확인하세요"
              : "입장료, 주차, 혜택 등은 공식 홈페이지 참고"}
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
              className="rounded-xl text-sm bg-accent-purple hover:bg-accent-purple/90 text-white"
            >
              이동
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
