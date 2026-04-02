import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import type { TimelineItem } from "@/types/timeline";

const TYPE_COLORS: Record<string, string> = {
  prep: "#FFD4DE",
  shopping: "#FFE0CC",
  admin: "#FFF4D4",
  education: "#E4D6F0",
  wellbeing: "#D0EDE2",
};

interface TimelineCardProps {
  item: TimelineItem;
  status: "past" | "current" | "future";
  onDelete?: () => void;
}

export function TimelineCard({ item, status, onDelete }: TimelineCardProps) {
  const color = TYPE_COLORS[item.type] ?? "#E4D6F0";

  return (
    <div className="relative pl-20" id={`timeline-week-${item.week}`}>
      {/* Week circle */}
      <div
        className={`absolute left-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-black/4 transition-all ${
          status === "current" ? "scale-110 ring-4 ring-white shadow-md" : ""
        } ${status === "past" ? "opacity-50" : ""}`}
        style={{ backgroundColor: color }}
      >
        <span className="text-sm font-semibold text-[#3D4447]">{item.week}주</span>
      </div>

      {/* Card */}
      <Card
        className={`rounded-xl shadow-sm transition-all border ${
          status === "current"
            ? "ring-2 ring-offset-2 border-black/4"
            : status === "past"
            ? "opacity-60 border-black/4"
            : "border-black/4"
        }`}
        style={status === "current" ? ({ "--tw-ring-color": color } as React.CSSProperties) : {}}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
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
            </div>
            {item.isCustom && onDelete && (
              <button
                onClick={onDelete}
                className="p-1 rounded-lg text-[#9CA0A4] hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
                aria-label="삭제"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
