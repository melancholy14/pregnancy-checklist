"use client";

import { useState } from "react";
import { useDueDateStore } from "@/store/useDueDateStore";
import { sendGAEvent } from "@/lib/analytics";
import { calcPregnancyWeek } from "@/lib/week-calculator";
import { Button } from "@/components/ui/button";

interface DueDateStepProps {
  onNext: () => void;
}

export function DueDateStep({ onNext }: DueDateStepProps) {
  const { setDueDate } = useDueDateStore();
  const [dateValue, setDateValue] = useState("");

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateValue(e.target.value);
  };

  const handleNext = () => {
    if (dateValue) {
      setDueDate(dateValue);
      const week = calcPregnancyWeek(new Date(dateValue));
      sendGAEvent("onboarding_due_date_set", { pregnancy_week: week });
    }
    onNext();
  };

  const handleSkip = () => {
    sendGAEvent("onboarding_due_date_skip");
    onNext();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <h1 className="text-2xl mb-3">예정일을 알려주세요</h1>

      <p className="text-muted-foreground text-sm mb-8">
        예정일을 기준으로 주차별 맞춤
        <br />
        체크리스트를 만들어드려요
      </p>

      <div className="w-full max-w-xs mb-10">
        <input
          type="date"
          value={dateValue}
          onChange={handleDateChange}
          className="w-full px-4 py-3 bg-input-background rounded-xl border border-black/6 text-center focus:outline-none focus:ring-2 focus:ring-[#FFD4DE]/50 transition-shadow"
          aria-label="출산 예정일 선택"
        />
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={handleNext}
          disabled={!dateValue}
          className="w-full h-12 rounded-2xl bg-[#FFD4DE] text-[#3D4447] text-base hover:bg-[#FFD4DE]/80 disabled:opacity-40"
          aria-label="다음 단계로 이동"
        >
          다음
        </Button>
        <button
          onClick={handleSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          aria-label="예정일 나중에 입력하기"
        >
          나중에 입력할게요
        </button>
      </div>
    </div>
  );
}
