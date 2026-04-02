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
}

export function WeightChart({ data }: WeightChartProps) {
  if (data.length === 0) return null;

  return (
    <Card className="rounded-2xl shadow-md mb-6 border border-black/4">
      <CardContent className="p-6">
        <h3 className="mb-4">체중 추이</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F0C8D2" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#D4C4E4" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F2F0EE" />
            <XAxis
              dataKey="date"
              stroke="#7C8084"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="#7C8084"
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
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#F0C8D2"
              strokeWidth={2.5}
              dot={{ fill: "#F0C8D2", r: 4, strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
              fill="url(#weightGradient)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
