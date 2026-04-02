import { MapPin, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BabyfairEvent } from "@/types/babyfair";

const CITY_COLORS: Record<string, string> = {
  서울: "#F0C8D2",
  부산: "#D4C4E4",
  대구: "#C0DCD0",
  인천: "#ECD2BE",
  경기: "#E8E2C6",
  광주: "#F0C8D2",
  대전: "#C0DCD0",
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
  const color = CITY_COLORS[event.city] ?? "#F0C8D2";

  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-black/4 group hover:-translate-y-0.5">
      <CardContent className="p-6">
        {/* City Badge */}
        <div className="flex justify-between items-start mb-4">
          <Badge
            className="rounded-lg text-sm border border-black/4 px-3 py-1 text-[#2D3436] font-medium"
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
  );
}
