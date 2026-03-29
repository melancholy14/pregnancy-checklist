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
    <Card className="rounded-3xl shadow-md mb-6 border-0">
      <CardContent className="p-6">
        <h3 className="mb-4">체중 추이</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFD6E0" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#E8D5F5" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              stroke="#999"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="#999"
              style={{ fontSize: "12px" }}
              domain={["dataMin - 2", "dataMax + 2"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#FFD6E0"
              strokeWidth={3}
              dot={{ fill: "#FFD6E0", r: 5 }}
              activeDot={{ r: 7 }}
              fill="url(#weightGradient)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
