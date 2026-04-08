import type { ChecklistItem } from "@/types/checklist";

export type BrandPhase = "pregnancy" | "postpartum" | "parenting";

export const BRAND_PHASE: BrandPhase = "pregnancy";

export const BRAND_COPY = {
  pregnancy: {
    heroSub: "답답해서 직접 만들었습니다",
    heroCaption: "초산 임신 중인 개발자의 출산 준비 기록",
    motivation: "같이 준비하면 덜 막막하니까요",
    onboardingGreeting: "저도 초산이라 뭐부터 해야 할지 몰라서 이 체크리스트를 만들었어요.",
  },
  postpartum: {
    heroSub: "답답해서 직접 만들었습니다",
    heroCaption: "초산 개발자의 출산 준비 & 산후조리 기록",
    motivation: "같이 준비하면 덜 막막하니까요",
    onboardingGreeting: "초산 출산을 겪으며 만든 체크리스트예요. 같이 준비해봐요.",
  },
  parenting: {
    heroSub: "답답해서 직접 만들었습니다",
    heroCaption: "초산 개발자의 임신·출산·육아 기록",
    motivation: "같이 준비하면 덜 막막하니까요",
    onboardingGreeting: "임신부터 육아까지, 직접 겪으며 정리한 체크리스트예요.",
  },
} as const;

export const BASE_URL = "https://pregnancy-checklist.com";

export const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "출산 준비 체크리스트",
} as const;

export const CATEGORY_OPTIONS: { value: ChecklistItem["category"]; label: string }[] = [
  { value: "hospital", label: "병원 준비" },
  { value: "hospital_bag", label: "출산 가방" },
  { value: "baby_items", label: "신생아 준비" },
  { value: "postpartum", label: "산후 준비" },
  { value: "admin", label: "행정 준비" },
];

export const CATEGORY_FILTER_OPTIONS: { value: ChecklistItem["category"] | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  ...CATEGORY_OPTIONS,
];
