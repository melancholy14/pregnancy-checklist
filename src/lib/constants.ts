import type { ChecklistItem } from "@/types/checklist";

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
