import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProgressSummaryProps {
  checked: number;
  total: number;
  percent: number;
}

export function ProgressSummary({ checked, total, percent }: ProgressSummaryProps) {
  return (
    <Card className="rounded-3xl shadow-md mb-6 border-0">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-2">
          <span>전체 진행률</span>
          <span className="text-lg">
            <strong>{checked}</strong>/{total} 완료
          </span>
        </div>
        <Progress value={percent} className="h-3 bg-gray-100" />
      </CardContent>
    </Card>
  );
}
