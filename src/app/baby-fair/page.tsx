import type { Metadata } from "next";
import babyfairEvents from "@/data/babyfair_events.json";
import type { BabyfairEvent } from "@/types/babyfair";
import { BabyfairContainer } from "@/components/babyfair/BabyfairContainer";

export const metadata: Metadata = {
  title: "베이비페어 일정 모음 - 출산 준비 체크리스트",
  description: "전국 베이비페어 일정, 장소, 공식 링크를 한곳에서 확인하세요.",
};

export default function BabyFairPage() {
  return <BabyfairContainer events={babyfairEvents as BabyfairEvent[]} />;
}
