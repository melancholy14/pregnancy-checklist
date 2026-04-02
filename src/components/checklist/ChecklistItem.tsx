import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import type { ChecklistItem as ChecklistItemType } from "@/types/checklist";

const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: "bg-[#FFD4DE]/60", text: "text-[#B04060]", label: "높음" },
  medium: { bg: "bg-[#FFF4D4]/60", text: "text-[#8B7520]", label: "보통" },
  low: { bg: "bg-[#D0EDE2]/60", text: "text-[#2D6B4F]", label: "낮음" },
};

interface ChecklistItemProps {
  item: ChecklistItemType;
  isChecked: boolean;
  isHighlighted?: boolean;
  onToggle: () => void;
  onDelete?: () => void;
}

export function ChecklistItem({ item, isChecked, isHighlighted, onToggle, onDelete }: ChecklistItemProps) {
  const priority = PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.medium;

  return (
    <Card
      className={`rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md border ${
        isChecked
          ? "bg-[#D0EDE2]/20 border-[#D0EDE2]/30"
          : isHighlighted
          ? "bg-[#FFF4D4]/20 border-[#FFF4D4]/50 shadow-sm"
          : "bg-white border-black/4"
      }`}
      onClick={onToggle}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isChecked}
            onCheckedChange={onToggle}
            className="size-6 rounded-lg border-2 data-[state=checked]:bg-[#D0EDE2] data-[state=checked]:border-[#D0EDE2] data-[state=checked]:text-[#3D4447] border-gray-200 shrink-0"
            onClick={(e) => e.stopPropagation()}
          />
          <span
            className={`flex-1 text-[15px] ${
              isChecked ? "line-through text-[#9CA0A4]" : "text-foreground"
            }`}
          >
            {item.title}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={`${priority.bg} ${priority.text} text-[11px] px-2 py-0.5 rounded-md border-0 hover:${priority.bg}`}>
              {priority.label}
            </Badge>
            {item.isCustom && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 rounded-lg text-[#9CA0A4] hover:text-red-400 hover:bg-red-50 transition-colors"
                aria-label="삭제"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
        {isHighlighted && !isChecked && (
          <div className="mt-2 ml-9">
            <span className="text-xs text-[#8B7520]">이번 주차에 추천하는 항목이에요</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
