import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface ChartEntry {
  date: string;
  weight: number;
}

interface WeightChartProps {
  data: ChartEntry[];
  baseWeight?: number;
}

export function WeightChart({ data, baseWeight }: WeightChartProps) {
  if (data.length === 0) return null;

  // 권장 체중 증가 범위 (대한산부인과학회 기준, 정상 BMI 기준)
  // 정상 BMI(18.5~24.9): 총 11.5~16kg 증가 권장
  const minTarget = baseWeight ? baseWeight + 11.5 : undefined;
  const maxTarget = baseWeight ? baseWeight + 16 : undefined;

  return (
    <Card className="rounded-2xl shadow-md mb-6 border border-black/4">
      <CardContent className="p-6">
        <h3 className="mb-4">체중 추이</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFD4DE" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#E4D6F0" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F8F6F4" />
            <XAxis
              dataKey="date"
              stroke="#9CA0A4"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="#9CA0A4"
              style={{ fontSize: "12px" }}
              domain={["dataMin - 2", "dataMax + 2"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid rgba(0,0,0,0.06)",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              }}
              formatter={(value: number) => [`${value} kg`, "체중"]}
            />
            {minTarget && (
              <ReferenceLine
                y={minTarget}
                stroke="#D0EDE2"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{ value: "권장 하한", position: "right", fontSize: 10, fill: "#9CA0A4" }}
              />
            )}
            {maxTarget && (
              <ReferenceLine
                y={maxTarget}
                stroke="#FFE0CC"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{ value: "권장 상한", position: "right", fontSize: 10, fill: "#9CA0A4" }}
              />
            )}
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#FFD4DE"
              strokeWidth={2.5}
              dot={{ fill: "#FFD4DE", r: 4, strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
              fill="url(#weightGradient)"
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
          {baseWeight
            ? `권장 범위: 임신 전 체중(${baseWeight}kg) 기준 +11.5~16kg (정상 BMI 기준)`
            : "첫 기록을 기준 체중으로 사용합니다. 기록이 2개 이상이면 권장 범위가 표시됩니다."}
          <br />
          출처: 대한산부인과학회 임신 중 체중 관리 가이드라인
          <br />
          <span className="text-[10px]">
            * 본 정보는 참고용이며 의료적 조언이 아닙니다. 정확한 체중 관리는 담당 의사와 상담하세요.
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
