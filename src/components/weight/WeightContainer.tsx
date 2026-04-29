"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Plus, X, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { useWeightStore } from "@/store/useWeightStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeightForm } from "./WeightForm";
import { PageDescription } from "@/components/common/PageDescription";

const WeightChart = dynamic(
  () => import("./WeightChart").then((m) => ({ default: m.WeightChart })),
  { ssr: false }
);

export function WeightContainer() {
  const { logs, addLog, removeLog } = useWeightStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const hydrated = useSyncExternalStore(
    (cb) => useWeightStore.persist.onFinishHydration(cb),
    () => useWeightStore.persist.hasHydrated(),
    () => false
  );

  const handleSubmit = (date: string, weight: number) => {
    addLog({ id: Date.now().toString(), date, weight });
    setShowAddForm(false);
  };

  const entries = hydrated ? logs : [];

  const chartData = useMemo(
    () =>
      entries.map((e) => ({
        date: format(parseISO(e.date), "MM/dd", { locale: ko }),
        weight: e.weight,
      })),
    [entries]
  );

  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="pt-8">
        <h1 className="mb-2 text-center">체중 기록</h1>
        <PageDescription>
          임신 중 체중 변화를 주차별로 기록하고 그래프로 확인하세요.
          대한산부인과학회 기준 BMI별 적정 체중 증가 범위를 참고할 수
          있습니다. 정기 검진 때 담당 의료진과 함께 체중 추이를
          확인하는 데 활용해 보세요.
        </PageDescription>

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
        <div className="space-y-2.5">
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

        {/* Related Article */}
        <Link
          href="/articles/pregnancy-weight-management"
          className="block mt-6 mb-20 no-underline"
        >
          <Card className="rounded-2xl border border-pastel-peach/40 bg-pastel-peach/10 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-pastel-peach flex items-center justify-center shrink-0">
                <FileText size={18} strokeWidth={1.8} className="text-foreground" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">임신 중 체중 관리 가이드</p>
                <p className="text-xs text-muted-foreground">BMI별 권장 범위부터 안전한 운동법까지</p>
              </div>
              <span className="text-muted-foreground text-sm">→</span>
            </CardContent>
          </Card>
        </Link>

        {/* FAB */}
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="fixed fab-bottom-safe right-6 w-14 h-14 bg-pastel-pink rounded-2xl shadow-lg hover:bg-pastel-pink-hover hover:scale-105 transition-all duration-200"
            size="icon"
          >
            <Plus size={24} strokeWidth={2.2} className="text-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
}
