"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ChevronRight, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageDescription } from "@/components/common/PageDescription";
import { useChecklistStore } from "@/store/useChecklistStore";
import {
  createChecklistStore,
  useHospitalBagStore,
  usePartnerPrepStore,
  usePregnancyPrepStore,
} from "@/store/createChecklistStore";
import type { ChecklistData, ChecklistItem } from "@/types/checklist";

type ChecklistStoreHook = ReturnType<typeof createChecklistStore>;

interface ChecklistHubProps {
  hospitalBag: ChecklistData;
  partnerPrep: ChecklistData;
  pregnancyPrep: ChecklistData;
  timelineChecklistTotal: number;
}

interface ChecklistCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  subcategoryLabels: string[];
  useStore: ChecklistStoreHook;
  baseItems: ChecklistItem[];
}

function ChecklistCard({
  href,
  icon,
  title,
  description,
  subcategoryLabels,
  useStore,
  baseItems,
}: ChecklistCardProps) {
  const { checkedIds, customItems } = useStore();
  const hydrated = useSyncExternalStore(
    (cb) => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
    () => false
  );

  const total = baseItems.length + customItems.length;
  const checked = hydrated
    ? [...baseItems, ...customItems].filter((i) => checkedIds.includes(i.id)).length
    : 0;
  const percent = total > 0 ? (checked / total) * 100 : 0;

  return (
    <Link href={href} className="block no-underline">
      <Card className="rounded-2xl shadow-sm border border-black/4 hover:shadow-md transition-all duration-200">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <span className="text-3xl shrink-0" aria-hidden>
              {icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h2 className="text-[15px] font-medium text-foreground">{title}</h2>
                <ChevronRight size={18} className="text-muted-foreground shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                {description}
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {subcategoryLabels.map((label) => (
                  <span
                    key={label}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-pastel-lavender/30 text-foreground"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2">
                <Progress value={percent} className="h-1.5 bg-muted flex-1" />
                <span className="text-[11px] tabular-nums text-muted-foreground shrink-0">
                  {checked}/{total}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function TimelineCard({ baseTotal }: { baseTotal: number }) {
  const { checkedIds, customItems } = useChecklistStore();
  const hydrated = useSyncExternalStore(
    (cb) => useChecklistStore.persist.onFinishHydration(cb),
    () => useChecklistStore.persist.hasHydrated(),
    () => false
  );
  const total = baseTotal + (hydrated ? customItems.length : 0);
  const checked = hydrated ? checkedIds.length : 0;
  const percent = total > 0 ? (checked / total) * 100 : 0;

  return (
    <Link href="/timeline" className="block no-underline">
      <Card className="rounded-2xl shadow-sm border border-black/4 hover:shadow-md transition-all duration-200">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <span className="w-12 h-12 rounded-2xl bg-pastel-pink/40 flex items-center justify-center shrink-0">
              <Calendar size={24} className="text-foreground" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h2 className="text-[15px] font-medium text-foreground">주차별 타임라인</h2>
                <ChevronRight size={18} className="text-muted-foreground shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                임신 4주부터 40주까지 주차별로 해야 할 검사·준비를 알려드려요.
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-pastel-pink/40 text-foreground">
                  37주차
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-pastel-yellow/40 text-foreground">
                  체크 항목 {baseTotal}개
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Progress value={percent} className="h-1.5 bg-muted flex-1" />
                <span className="text-[11px] tabular-nums text-muted-foreground shrink-0">
                  {checked}/{total}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ChecklistHub({
  hospitalBag,
  partnerPrep,
  pregnancyPrep,
  timelineChecklistTotal,
}: ChecklistHubProps) {
  const cards = useMemo(
    () => [
      { data: hospitalBag, useStore: useHospitalBagStore },
      { data: partnerPrep, useStore: usePartnerPrepStore },
      { data: pregnancyPrep, useStore: usePregnancyPrepStore },
    ],
    [hospitalBag, partnerPrep, pregnancyPrep]
  );

  return (
    <div className="min-h-screen pb-24 px-4 bg-linear-to-b from-background to-white">
      <div className="pt-8">
        <h1 className="mb-2 text-center">✅ 체크리스트</h1>
        <PageDescription>
          임신부터 출산까지, 빠뜨리지 않고 준비하세요. 주차별 타임라인부터
          출산가방·남편준비·임신준비까지 목적에 맞는 체크리스트를 골라 사용할 수 있어요.
          체크 상태는 기기에 자동 저장되어 다시 방문해도 그대로 남아 있어요.
        </PageDescription>

        <div className="space-y-4">
          <TimelineCard baseTotal={timelineChecklistTotal} />
          {cards.map(({ data, useStore }) => (
            <ChecklistCard
              key={data.meta.slug}
              href={`/checklist/${data.meta.slug}`}
              icon={data.meta.icon}
              title={data.meta.title}
              description={data.meta.description}
              subcategoryLabels={data.meta.subcategories.map((s) => s.label)}
              useStore={useStore}
              baseItems={data.items}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
