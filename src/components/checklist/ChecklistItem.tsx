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
      className={`rounded-2xl shadow-sm cursor-pointer transition-all hover:shadow-md border-0 ${
        isChecked ? "bg-[#D5F0E8]/30" : "bg-white"
      }`}
      onClick={onToggle}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Checkbox
            checked={isChecked}
            onCheckedChange={onToggle}
            className="size-7 rounded-full border-2 data-[state=checked]:bg-[#D5F0E8] data-[state=checked]:border-[#D5F0E8] data-[state=checked]:text-[#4A4A4A] border-gray-300"
            onClick={(e) => e.stopPropagation()}
          />
          <span
            className={`flex-1 ${
              isChecked ? "line-through text-gray-400" : "text-gray-700"
            }`}
          >
            {item.title}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
