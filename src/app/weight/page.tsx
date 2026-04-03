import type { Metadata } from "next";
import { WeightContainer } from "@/components/weight/WeightContainer";

export const metadata: Metadata = {
  title: "임신 체중 기록 & 변화 그래프 - 출산 준비 체크리스트",
  description: "임신 중 체중 변화를 기록하고 그래프로 한눈에 확인하세요.",
};

export default function WeightPage() {
  return <WeightContainer />;
}
