import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { ChecklistItem as ChecklistItemType } from "@/types/checklist";

interface ChecklistItemProps {
  item: ChecklistItemType;
  isChecked: boolean;
  onToggle: () => void;
}

export function ChecklistItem({ item, isChecked, onToggle }: ChecklistItemProps) {
  return (
    <Card
      className={`rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md border ${
        isChecked ? "bg-[#C0DCD0]/20 border-[#C0DCD0]/30" : "bg-white border-black/4"
      }`}
      onClick={onToggle}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Checkbox
            checked={isChecked}
            onCheckedChange={onToggle}
            className="size-6 rounded-lg border-2 data-[state=checked]:bg-[#C0DCD0] data-[state=checked]:border-[#C0DCD0] data-[state=checked]:text-[#2D3436] border-gray-200"
            onClick={(e) => e.stopPropagation()}
          />
          <span
            className={`flex-1 text-[15px] ${
              isChecked ? "line-through text-[#7C8084]" : "text-foreground"
            }`}
          >
            {item.title}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
