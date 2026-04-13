"use client";

import { useState, useEffect } from "react";
import { useDueDateStore } from "@/store/useDueDateStore";
import { calcPregnancyWeek } from "@/lib/week-calculator";
import { sendGAEvent } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DueDateInput() {
  const { dueDate, setDueDate } = useDueDateStore();
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && dueDate) {
      setCurrentWeek(calcPregnancyWeek(new Date(dueDate)));
    }
  }, [hydrated, dueDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDueDate(value);
    if (value) {
      const week = calcPregnancyWeek(new Date(value));
      sendGAEvent("due_date_set", { pregnancy_week: week });
    }
  };

  return (
    <Card className="rounded-2xl shadow-md border border-black/4">
      <CardContent className="p-5">
        <label className="block mb-3 text-center text-sm">출산 예정일을 입력하세요</label>
        <input
          type="date"
          value={hydrated ? (dueDate ?? "") : ""}
          onChange={handleDateChange}
          className="w-full px-4 py-3 bg-input-background rounded-xl border border-black/6 text-center focus:outline-none focus:ring-2 focus:ring-pastel-pink/50 transition-shadow"
        />
        {hydrated && currentWeek !== null && (
          <div className="mt-4 text-center">
            <Badge className="bg-pastel-pink/60 text-foreground px-6 py-3 rounded-xl text-lg border-0 hover:bg-pastel-pink/60">
              현재 임신 <strong>{currentWeek}주</strong>
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
