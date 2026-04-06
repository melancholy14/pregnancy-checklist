"use client";

import { Lock, CheckCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReadyStepProps {
  onComplete: () => void;
}

const infoItems = [
  {
    icon: Lock,
    text: "입력한 정보는 이 브라우저에만 저장돼요",
    color: "#E4D6F0",
  },
  {
    icon: CheckCircle,
    text: "회원가입 없이 바로 시작!",
    color: "#D0EDE2",
  },
  {
    icon: Save,
    text: "다시 와도 기록이 남아있어요",
    color: "#FFE0CC",
  },
];

export function ReadyStep({ onComplete }: ReadyStepProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <h1 className="text-2xl mb-8">준비 완료!</h1>

      <ul className="space-y-4 mb-10 text-left w-full max-w-xs">
        {infoItems.map(({ icon: Icon, text, color }) => (
          <li key={text} className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: color }}
            >
              <Icon size={20} strokeWidth={1.8} className="text-[#3D4447]" />
            </span>
            <span className="text-sm">{text}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={onComplete}
        className="w-full max-w-xs h-12 rounded-2xl bg-[#FFD4DE] text-[#3D4447] text-base hover:bg-[#FFD4DE]/80"
        aria-label="체크리스트 보러가기"
      >
        체크리스트 보러가기 →
      </Button>
    </div>
  );
}
