"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { BabyfairEvent } from "@/types/babyfair";
import { BabyfairCard } from "./BabyfairCard";

type BabyfairTab = "ongoing" | "upcoming" | "ended";

interface BabyfairContainerProps {
  events: BabyfairEvent[];
}

export function BabyfairContainer({ events }: BabyfairContainerProps) {
  const [today] = useState(() => new Date().toISOString().split("T")[0]);
  const [citiesExpanded, setCitiesExpanded] = useState(false);
  const [citiesOverflow, setCitiesOverflow] = useState(false);
  const citiesRef = useRef<HTMLDivElement>(null);

  const cities = useMemo(() => {
    const set = new Set(events.map((e) => e.city));
    return ["전체", ...Array.from(set)];
  }, [events]);

  const years = useMemo(() => {
    const set = new Set(events.map((e) => e.start_date.slice(0, 4)));
    return ["전체", ...Array.from(set).sort()];
  }, [events]);

  const [selectedCity, setSelectedCity] = useState("전체");
  const [selectedYear, setSelectedYear] = useState("전체");

  const ongoingEvents = useMemo(() => {
    return events.filter(
      (e) => e.start_date <= today && e.end_date >= today
    );
  }, [events, today]);

  const [tab, setTab] = useState<BabyfairTab>(
    ongoingEvents.length > 0 ? "ongoing" : "upcoming"
  );

  useEffect(() => {
    const el = citiesRef.current;
    if (el) setCitiesOverflow(el.scrollHeight > el.clientHeight + 4);
  }, [cities]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (selectedCity !== "전체" && e.city !== selectedCity) return false;
      if (selectedYear !== "전체" && !e.start_date.startsWith(selectedYear)) return false;
      if (tab === "ongoing" && !(e.start_date <= today && e.end_date >= today)) return false;
      if (tab === "upcoming" && !(e.start_date > today)) return false;
      if (tab === "ended" && !(e.end_date < today)) return false;
      return true;
    });
  }, [events, selectedCity, selectedYear, tab, today]);

  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="pt-8">
        <h1 className="mb-2 text-center">베이비페어 일정</h1>
        <p className="text-center text-muted-foreground mb-6">
          {new Date().getFullYear()}년 전국 베이비페어 행사 안내
        </p>

        {events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-5xl mb-4">📋</div>
            <p>아직 등록된 행사가 없어요</p>
            <p className="text-sm mt-1">곧 업데이트될 예정입니다</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              {years.length > 2 && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-black/6 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D0EDE2]/50"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y === "전체" ? "전체 연도" : `${y}년`}</option>
                  ))}
                </select>
              )}
              <div>
                <div
                  ref={citiesRef}
                  className={`flex flex-wrap gap-1.5 overflow-hidden transition-[max-height] duration-300 ${
                    citiesExpanded ? "max-h-[500px]" : "max-h-[5.5rem]"
                  }`}
                >
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(city)}
                      className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap border transition-all ${
                        selectedCity === city
                          ? "bg-[#D0EDE2]/40 border-[#D0EDE2]/30 text-[#3D4447]"
                          : "bg-white border-black/4 text-[#9CA0A4] hover:bg-muted"
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
                {citiesOverflow && (
                  <button
                    type="button"
                    onClick={() => setCitiesExpanded((v) => !v)}
                    className="flex items-center gap-1 mt-2 text-xs text-[#9CA0A4] hover:text-[#3D4447] transition-colors"
                  >
                    {citiesExpanded ? "접기" : "더보기"}
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${citiesExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={tab} onValueChange={(v) => setTab(v as BabyfairTab)}>
              <TabsList className="flex gap-2 mb-6 bg-transparent h-auto p-0">
                <TabsTrigger
                  value="ongoing"
                  className="px-4 py-2 rounded-xl border border-black/4 bg-white text-[#9CA0A4] data-[state=active]:bg-[#D0EDE2]/40 data-[state=active]:text-[#3D4447] data-[state=active]:border-[#D0EDE2]/30 h-auto transition-all"
                >
                  진행 중{ongoingEvents.length > 0 && ` (${ongoingEvents.length})`}
                </TabsTrigger>
                <TabsTrigger
                  value="upcoming"
                  className="px-4 py-2 rounded-xl border border-black/4 bg-white text-[#9CA0A4] data-[state=active]:bg-[#D0EDE2]/40 data-[state=active]:text-[#3D4447] data-[state=active]:border-[#D0EDE2]/30 h-auto transition-all"
                >
                  예정
                </TabsTrigger>
                <TabsTrigger
                  value="ended"
                  className="px-4 py-2 rounded-xl border border-black/4 bg-white text-[#9CA0A4] data-[state=active]:bg-[#D0EDE2]/40 data-[state=active]:text-[#3D4447] data-[state=active]:border-[#D0EDE2]/30 h-auto transition-all"
                >
                  지난 행사
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ongoing">
                {filtered.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>현재 진행 중인 행사가 없어요</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((event) => (
                      <BabyfairCard key={event.slug} event={event} daysLeft={Math.ceil((new Date(event.end_date).getTime() - new Date(today).getTime()) / 86400000)} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upcoming">
                {filtered.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>예정된 행사가 없어요</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((event) => (
                      <BabyfairCard key={event.slug} event={event} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ended">
                {filtered.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>지난 행사가 없어요</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((event) => (
                      <BabyfairCard key={event.slug} event={event} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Info Card */}
        <Card className="mt-8 rounded-2xl shadow-md border border-black/4 bg-linear-to-r from-[#FFD4DE]/40 to-[#E4D6F0]/40">
          <CardContent className="p-6">
            <h3 className="mb-3">참관 팁</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-[#FFD4DE] mt-2 shrink-0" />
                사전 등록하면 입장료 할인 혜택이 있어요
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-[#E4D6F0] mt-2 shrink-0" />
                카드 여러 개 준비하면 카드사 할인 받을 수 있어요
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-[#D0EDE2] mt-2 shrink-0" />
                오전 일찍 가면 인기 상품 선착순 혜택을 받을 수 있어요
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-[#FFE0CC] mt-2 shrink-0" />
                큰 에코백이나 카트 챙겨가세요
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-[#FFF4D4] mt-2 shrink-0" />
                편한 신발 필수! 많이 걸어야 해요
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
