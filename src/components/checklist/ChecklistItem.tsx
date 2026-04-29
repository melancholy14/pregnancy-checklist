import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import type { ChecklistItem as ChecklistItemType } from "@/types/checklist";

const PRIORITY_STYLES: Record<string, { className: string; label: string }> = {
  high: { className: "bg-pastel-pink/60 text-accent-red hover:bg-pastel-pink/60", label: "높음" },
  medium: { className: "bg-pastel-yellow/60 text-accent-olive hover:bg-pastel-yellow/60", label: "보통" },
  low: { className: "bg-pastel-mint/60 text-accent-green hover:bg-pastel-mint/60", label: "낮음" },
};

interface ChecklistItemProps {
  item: ChecklistItemType;
  isChecked: boolean;
  isHighlighted?: boolean;
  onToggle: () => void;
  onDelete?: () => void;
}

export function ChecklistItem({ item, isChecked, isHighlighted, onToggle, onDelete }: ChecklistItemProps) {
  const priority = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.medium;

  return (
    <Card
      className={`rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md border ${
        isChecked
          ? "bg-pastel-mint/20 border-pastel-mint/30"
          : isHighlighted
          ? "bg-pastel-yellow/20 border-pastel-yellow/40 shadow-sm"
          : "bg-white border-black/4"
      }`}
      onClick={onToggle}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isChecked}
            onCheckedChange={onToggle}
            className="size-6 rounded-md border-2 data-[state=checked]:bg-pastel-mint data-[state=checked]:border-pastel-mint data-[state=checked]:text-foreground border-gray-200 shrink-0"
            onClick={(e) => e.stopPropagation()}
          />
          <span
            className={`flex-1 text-[15px] ${
              isChecked ? "line-through text-muted-foreground" : "text-foreground"
            }`}
          >
            {item.title}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={`${priority.className} text-[11px] px-2 py-0.5 rounded-md border-0`}>
              {priority.label}
            </Badge>
            {item.isCustom && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-50 transition-colors"
                aria-label="삭제"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
        {isHighlighted && !isChecked && (
          <div className="mt-2 ml-9">
            <span className="text-xs text-accent-olive">이번 주차에 추천하는 항목이에요</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
