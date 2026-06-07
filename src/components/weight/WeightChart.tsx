import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

  return (
    <Card className="rounded-2xl shadow-sm mb-6 border border-black/4">
      <CardContent className="p-4">
        <h3 className="mb-4">체중 추이</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFE0CC" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#FFE0CC" stopOpacity={0} />
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
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#FFE0CC"
              strokeWidth={2.5}
              dot={{ fill: "#FFE0CC", r: 4, strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
              fill="url(#weightGradient)"
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
          {baseWeight
            ? `첫 기록(${baseWeight}kg) 대비 추이입니다. 정상 BMI 기준 임신 중 총 11.5~16kg 증가가 권장됩니다.`
            : "기록이 누적되면 추이를 확인할 수 있어요. 정상 BMI 기준 임신 중 총 11.5~16kg 증가가 권장됩니다."}
          <br />
          출처: 대한산부인과학회 임신 중 체중 관리 가이드라인
          <br />
          <span className="text-[11px]">
            * 본 정보는 참고용이며 의료적 조언이 아닙니다. 정확한 체중 관리는 담당 의사와 상담하세요.
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
