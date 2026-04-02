import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProgressSummaryProps {
  checked: number;
  total: number;
  percent: number;
}

export function ProgressSummary({ checked, total, percent }: ProgressSummaryProps) {
  return (
    <Card className="rounded-2xl shadow-md mb-6 border border-black/4">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-muted-foreground">전체 진행률</span>
          <span className="text-base tabular-nums">
            <strong>{checked}</strong>
            <span className="text-muted-foreground">/{total}</span> 완료
          </span>
        </div>
        <Progress value={percent} className="h-2.5 bg-muted" />
      </CardContent>
    </Card>
  );
}
