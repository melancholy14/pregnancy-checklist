import { MapPin, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Fair {
  id: string;
  name: string;
  dates: string;
  location: string;
  city: string;
  color: string;
}

interface BabyfairCardProps {
  fair: Fair;
}

export function BabyfairCard({ fair }: BabyfairCardProps) {
  return (
    <Card className="rounded-3xl shadow-md hover:shadow-xl transition-all cursor-pointer border-0 group">
      <CardContent className="p-6">
        {/* City Badge */}
        <div className="flex justify-between items-start mb-4">
          <Badge
            className="rounded-full text-sm shadow-sm border-0 px-4 py-1.5 text-[#4A4A4A]"
            style={{ backgroundColor: fair.color }}
          >
            {fair.city}
          </Badge>
        </div>

        {/* Event Name */}
        <h3 className="mb-3 group-hover:text-gray-600 transition-colors">
          {fair.name}
        </h3>

        {/* Dates */}
        <div className="flex items-start gap-2 mb-2 text-sm text-gray-600">
          <Calendar size={16} className="mt-0.5 shrink-0" />
          <span>{fair.dates}</span>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin size={16} className="mt-0.5 shrink-0" />
          <span>{fair.location}</span>
        </div>

        {/* Decorative Element */}
        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
          입장료, 주차, 혜택 등은 공식 홈페이지 참고
        </div>
      </CardContent>
    </Card>
  );
}
