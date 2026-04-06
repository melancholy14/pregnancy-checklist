"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendGAEvent } from "@/lib/analytics";
import { WelcomeStep } from "./WelcomeStep";
import { DueDateStep } from "./DueDateStep";
import { ReadyStep } from "./ReadyStep";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const handleComplete = () => {
    try {
      localStorage.setItem("onboarding-completed", "true");
    } catch {
      // localStorage 접근 불가 시 무시
    }
    sendGAEvent("onboarding_complete");
    onComplete();
    router.push("/timeline");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Step indicators */}
      <div
        className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2"
        role="group"
        aria-label="온보딩 진행 상태"
      >
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            role="presentation"
            aria-label={`${s}단계 ${s === step ? "진행 중" : s < step ? "완료" : "대기"}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              s === step ? "w-6 bg-[#FFD4DE]" : s < step ? "w-6 bg-[#FFD4DE]/50" : "w-6 bg-muted"
            }`}
          />
        ))}
      </div>

      {step === 1 && <WelcomeStep onNext={() => setStep(2)} />}
      {step === 2 && <DueDateStep onNext={() => setStep(3)} />}
      {step === 3 && <ReadyStep onComplete={handleComplete} />}
    </div>
  );
}
