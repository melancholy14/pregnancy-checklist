"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { useWeightStore } from "@/store/useWeightStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeightChart } from "./WeightChart";
import { WeightForm } from "./WeightForm";

export function WeightContainer() {
  const { logs, addLog, removeLog } = useWeightStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleSubmit = (date: string, weight: number) => {
    addLog({ id: Date.now().toString(), date, weight });
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
        <WeightChart data={chartData} />

        {/* Add Form */}
        {showAddForm && (
          <WeightForm
            onSubmit={handleSubmit}
            onClose={() => setShowAddForm(false)}
          />
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
              <Card key={entry.id} className="rounded-2xl shadow-sm border-0">
                <CardContent className="p-4 flex justify-between items-center group">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      {format(parseISO(entry.date), "yyyy년 M월 d일", {
                        locale: ko,
                      })}
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
