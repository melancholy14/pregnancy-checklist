"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronRight, FileText, Plus, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { useWeightStore, type WeightLog } from "@/store/useWeightStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeightForm } from "./WeightForm";
import { PageDescription } from "@/components/common/PageDescription";
import { useDeleteWithUndo } from "@/lib/hooks/useDeleteWithUndo";

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

  const handleDeleteLog = useDeleteWithUndo<WeightLog>({
    removeFn: removeLog,
    restoreFn: addLog,
    label: "체중 기록을 삭제했어요",
  });

  const handleSubmit = (date: string, weight: number) => {
    addLog({ id: Date.now().toString(), date, weight });
    setShowAddForm(false);
  };

  const entries = useMemo(() => (hydrated ? logs : []), [hydrated, logs]);

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
            <div className="py-12 text-muted-foreground">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">📊</div>
                <p className="font-medium text-foreground">
                  체중 기록은 임신 건강의 가장 직관적인 신호예요
                </p>
              </div>
              <div className="max-w-md mx-auto space-y-3 text-sm leading-relaxed">
                <p>
                  대한산부인과학회 기준 임신 중 적정 체중 증가는 BMI에 따라
                  달라져요. 정상 BMI는 총 11.5~16kg, 저체중은 12.5~18kg,
                  과체중·비만은 7~11.5kg 범위가 권장됩니다.
                </p>
                <p>
                  매주 같은 시간에 기록하면 변화 패턴을 한눈에 볼 수 있고,
                  정기 검진 때 의료진과 함께 그래프를 보면 임신성 당뇨나
                  임신중독증 같은 위험 신호를 일찍 잡을 수 있어요.
                </p>
                <p className="text-xs text-center pt-2">
                  아래 + 버튼으로 첫 기록을 시작하세요
                </p>
              </div>
            </div>
          )}

          {entries
            .slice()
            .reverse()
            .map((entry) => (
              <Card key={entry.id} className="rounded-2xl border border-black/4">
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
                    onClick={() => handleDeleteLog(entry)}
                    aria-label="체중 기록 삭제"
                    className="rounded-xl bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
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
          className="block mt-6 mb-4 no-underline"
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
              <ChevronRight size={16} aria-hidden="true" className="text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>

        {/* Tips */}
        <Card className="mb-20 rounded-2xl shadow-sm border border-pastel-yellow/30 bg-pastel-yellow/10">
          <CardContent className="p-5">
            <h3 className="mb-3 text-base font-semibold flex items-center gap-2">
              <span aria-hidden="true">💡</span>
              체중 기록 활용 팁
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span aria-hidden="true" className="w-1 h-1 rounded-full bg-pastel-yellow mt-2 shrink-0" />
                같은 시간·같은 옷·같은 체중계로 재야 패턴이 정확해요
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden="true" className="w-1 h-1 rounded-full bg-pastel-yellow mt-2 shrink-0" />
                임신 중기 이후 한 주에 0.5kg 이상 급증하면 의료진 상담을 권장해요
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden="true" className="w-1 h-1 rounded-full bg-pastel-yellow mt-2 shrink-0" />
                그래프가 평평하거나 감소하면 영양 섭취 점검이 필요해요
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden="true" className="w-1 h-1 rounded-full bg-pastel-yellow mt-2 shrink-0" />
                기록을 잘못 지웠다면 7초 안에 토스트의 &lsquo;되돌리기&rsquo;로 복구할 수 있어요
              </li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              정확한 진단과 처방은 산부인과 전문의 상담을 따라주세요.
            </p>
          </CardContent>
        </Card>

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
