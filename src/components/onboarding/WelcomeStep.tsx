"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND_COPY, BRAND_PHASE } from "@/lib/constants";

interface WelcomeStepProps {
  onNext: () => void;
}

const highlights = [
  "주차별로 뭘 해야 하는지 정리",
  "전국 베이비페어 일정 모음",
  "체중 기록 & 출산 정보까지",
];

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="mb-10">
        <div className="w-28 h-28 mx-auto rounded-full bg-linear-to-br from-pastel-pink via-pastel-lavender to-pastel-mint flex items-center justify-center shadow-lg overflow-hidden">
          <Image
            src="/home.png"
            alt="출산 준비"
            width={112}
            height={112}
            className="object-cover"
          />
        </div>
      </div>

      <h1 className="text-2xl mb-3">안녕하세요!</h1>
      <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
        {BRAND_COPY[BRAND_PHASE].onboardingGreeting}
      </p>

      <ul className="space-y-3 mt-6 mb-10 text-left">
        {highlights.map((text) => (
          <li key={text} className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-pastel-mint flex items-center justify-center shrink-0">
              <Check size={14} strokeWidth={2.5} className="text-accent-green-light" />
            </span>
            <span className="text-base">{text}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={onNext}
        className="w-full max-w-xs h-12 rounded-2xl bg-pastel-pink text-foreground text-base hover:bg-pastel-pink/80"
        aria-label="온보딩 시작하기"
      >
        시작하기
      </Button>
    </div>
  );
}
