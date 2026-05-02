import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ChecklistItem, ChecklistSubcategory } from "@/types/checklist";

interface ChecklistProgressProps {
  items: ChecklistItem[];
  checkedIds: string[];
  subcategories: ChecklistSubcategory[];
}

export function ChecklistProgress({ items, checkedIds, subcategories }: ChecklistProgressProps) {
  const total = items.length;
  const checked = items.filter((i) => checkedIds.includes(i.id)).length;
  const percent = total > 0 ? (checked / total) * 100 : 0;

  return (
    <Card className="rounded-2xl shadow-md mb-6 border border-black/4">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">전체 진행률</span>
          <span className="text-sm tabular-nums">
            <strong>{checked}</strong>
            <span className="text-muted-foreground">/{total}</span> 완료
          </span>
        </div>
        <Progress value={percent} className="h-2 bg-muted" />

        {subcategories.length > 1 && (
          <div className="mt-4 space-y-2.5">
            {subcategories.map((sub) => {
              const subItems = items.filter((i) => i.category === sub.key);
              const subChecked = subItems.filter((i) => checkedIds.includes(i.id)).length;
              const subTotal = subItems.length;
              const subPercent = subTotal > 0 ? (subChecked / subTotal) * 100 : 0;
              if (subTotal === 0) return null;
              return (
                <div key={sub.key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">{sub.label}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {subChecked}/{subTotal}
                    </span>
                  </div>
                  <Progress value={subPercent} className="h-1 bg-muted" />
                </div>
              );
            })}
          </div>
        )}

        {percent >= 25 && (
          <p className="text-xs text-center mt-3 text-accent-green font-medium">
            {percent >= 100
              ? "완벽하게 준비되었어요! 🎊"
              : percent >= 75
                ? "거의 다 왔어요!"
                : percent >= 50
                  ? "절반 완료!"
                  : "순조로운 출발!"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
