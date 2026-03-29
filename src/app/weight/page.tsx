"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useWeightStore } from "@/store/useWeightStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function WeightPage() {
  const { logs, addLog, removeLog } = useWeightStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleAdd = () => {
    if (!newDate || !newWeight) return;

    addLog({
      id: Date.now().toString(),
      date: newDate,
      weight: parseFloat(newWeight),
    });

    setNewDate("");
    setNewWeight("");
    setShowAddForm(false);
  };

  const entries = hydrated ? logs : [];

  const chartData = entries.map((e) => ({
    date: format(parseISO(e.date), "MM/dd", { locale: ko }),
    weight: e.weight,
  }));

  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="max-w-3xl mx-auto pt-8">
        <h1 className="mb-2 text-center">체중 기록</h1>
        <p className="text-center text-gray-500 mb-8">
          임신 중 체중 변화를 기록하고 확인하세요
        </p>

        {/* Chart */}
        {entries.length > 0 && (
          <Card className="rounded-3xl shadow-md mb-6 border-0">
            <CardContent className="p-6">
              <h3 className="mb-4">체중 추이</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData}>
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
        )}

        {/* Add Form */}
        {showAddForm && (
          <Card className="rounded-3xl shadow-md mb-6 border-0">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3>새 기록 추가</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  <X size={18} />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm">날짜</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-0"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm">체중 (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="예: 62.5"
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-0"
                  />
                </div>
                <Button
                  onClick={handleAdd}
                  className="w-full py-3 bg-[#FFD6E0] rounded-full hover:bg-[#ffcad5] text-[#4A4A4A] h-auto"
                >
                  추가
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weight List */}
        <div className="space-y-3 mb-20">
          {entries.length === 0 && !showAddForm && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-5xl mb-4">📊</div>
              <p>아직 기록이 없어요</p>
              <p className="text-sm mt-1">아래 버튼을 눌러 기록을 시작하세요</p>
            </div>
          )}

          {entries
            .slice()
            .reverse()
            .map((entry) => (
              <Card
                key={entry.id}
                className="rounded-2xl shadow-sm border-0"
              >
                <CardContent className="p-4 flex justify-between items-center group">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      {format(parseISO(entry.date), "yyyy년 M월 d일", { locale: ko })}
                    </div>
                    <div className="text-xl">
                      <strong>{entry.weight}</strong> kg
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLog(entry.id)}
                    className="rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                  >
                    <X size={18} />
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* FAB */}
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="fixed bottom-24 right-6 w-16 h-16 bg-[#FFD6E0] rounded-full shadow-lg hover:bg-[#ffcad5] hover:scale-110 transition-all"
            size="icon"
          >
            <Plus size={28} strokeWidth={2.5} color="#4A4A4A" />
          </Button>
        )}
      </div>
    </div>
  );
}
