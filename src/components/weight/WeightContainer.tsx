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
        <p className="text-center text-muted-foreground mb-8">
          임신 중 체중 변화를 기록하고 확인하세요
        </p>

        {/* Chart */}
        <WeightChart data={chartData} baseWeight={entries.length >= 2 ? entries[0].weight : undefined} />

        {/* Add Form */}
        {showAddForm && (
          <WeightForm
            onSubmit={handleSubmit}
            onClose={() => setShowAddForm(false)}
          />
        )}

        {/* Weight List */}
        <div className="space-y-2.5 mb-20">
          {entries.length === 0 && !showAddForm && (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-5xl mb-4">📊</div>
              <p>아직 기록이 없어요</p>
              <p className="text-sm mt-1">아래 버튼을 눌러 기록을 시작하세요</p>
            </div>
          )}

          {entries
            .slice()
            .reverse()
            .map((entry) => (
              <Card key={entry.id} className="rounded-xl border border-black/4">
                <CardContent className="p-4 flex justify-between items-center group">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      {format(parseISO(entry.date), "yyyy년 M월 d일", {
                        locale: ko,
                      })}
                    </div>
                    <div className="text-xl tabular-nums">
                      <strong>{entry.weight}</strong> kg
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLog(entry.id)}
                    className="rounded-xl bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
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
            className="fixed bottom-24 right-6 w-14 h-14 bg-[#FFD4DE] rounded-2xl shadow-lg hover:bg-[#f5cada] hover:scale-105 transition-all duration-200"
            size="icon"
          >
            <Plus size={24} strokeWidth={2.2} color="#3D4447" />
          </Button>
        )}
      </div>
    </div>
  );
}
