import type { Metadata } from "next";
import babyfairEvents from "@/data/babyfair_events.json";
import type { BabyfairEvent } from "@/types/babyfair";
import { BabyfairContainer } from "@/components/babyfair/BabyfairContainer";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "베이비페어 일정 모음 - 출산 준비 체크리스트",
  description: "전국 베이비페어 일정을 한곳에 모았습니다. 날짜·장소·링크까지.",
  alternates: {
    canonical: `${BASE_URL}/baby-fair`,
  },
  openGraph: {
    title: "베이비페어 일정 모음",
    description: "전국 베이비페어 일정을 한곳에 모았습니다. 날짜·장소·링크까지.",
    url: `${BASE_URL}/baby-fair`,
  },
};

export const metadata: Metadata = {
  title: "베이비페어 일정 모음 - 출산 준비 체크리스트",
  description: "전국 베이비페어 일정, 장소, 공식 링크를 한곳에서 확인하세요.",
  alternates: {
    canonical: `${BASE_URL}/baby-fair`,
  },
  openGraph: {
    title: "베이비페어 일정 모음",
    description: "전국 베이비페어 일정, 장소, 공식 링크를 한곳에서 확인하세요.",
    url: `${BASE_URL}/baby-fair`,
  },
};

export default function BabyFairPage() {
  return <BabyfairContainer events={babyfairEvents as BabyfairEvent[]} />;
}
