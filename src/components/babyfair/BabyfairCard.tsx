import { MapPin, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BabyfairEvent } from "@/types/babyfair";

const CITY_COLORS: Record<string, string> = {
  서울: "#FFD6E0",
  부산: "#E8D5F5",
  대구: "#D5F0E8",
  인천: "#FFE8D0",
  경기: "#FFF8D0",
  광주: "#FFD6E0",
  대전: "#D5F0E8",
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
  const color = CITY_COLORS[event.city] ?? "#FFD6E0";

  return (
    <Card className="rounded-3xl shadow-md hover:shadow-xl transition-all cursor-pointer border-0 group">
      <CardContent className="p-6">
        {/* City Badge */}
        <div className="flex justify-between items-start mb-4">
          <Badge
            className="rounded-full text-sm shadow-sm border-0 px-4 py-1.5 text-[#4A4A4A]"
            style={{ backgroundColor: color }}
          >
            {event.city}
          </Badge>
        </div>

        {/* Event Name */}
        <h3 className="mb-3 group-hover:text-gray-600 transition-colors">
          {event.name}
        </h3>

        {/* Dates */}
        <div className="flex items-start gap-2 mb-2 text-sm text-gray-600">
          <Calendar size={16} className="mt-0.5 shrink-0" />
          <span>{formatDateRange(event.start_date, event.end_date)}</span>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin size={16} className="mt-0.5 shrink-0" />
          <span>{event.venue_name}</span>
        </div>

        {/* Decorative Element */}
        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
          입장료, 주차, 혜택 등은 공식 홈페이지 참고
        </div>
      </CardContent>
    </Card>
  );
}
