import type { ChecklistItem } from "@/types/checklist";

export type DataToneClass =
  | "bg-pastel-lavender/20 text-foreground"
  | "bg-pastel-lavender/40 text-foreground"
  | "bg-pastel-mint/20 text-foreground"
  | "bg-pastel-mint/40 text-foreground"
  | "bg-pastel-peach/20 text-foreground"
  | "bg-pastel-peach/40 text-foreground"
  | "bg-pastel-yellow/20 text-foreground"
  | "bg-pastel-yellow/40 text-foreground";

export type DashboardSlotClass =
  | DataToneClass
  | "bg-pastel-pink/40 text-foreground";

export type CityGroup = "metropolitan" | "metro_city" | "yeongnam" | "other";

export type DashboardSlot =
  | "checklist"
  | "timeline"
  | "weight"
  | "info"
  | "babyfair"
  | "video";

const CITY_TO_GROUP: Partial<Record<string, CityGroup>> = {
  서울: "metropolitan",
  "서울(마곡)": "metropolitan",
  인천: "metropolitan",
  경기: "metropolitan",
  수원: "metropolitan",
  "수원(광교)": "metropolitan",
  "고양(일산)": "metropolitan",
  부산: "metro_city",
  대구: "metro_city",
  광주: "metro_city",
  대전: "metro_city",
  창원: "yeongnam",
  김해: "yeongnam",
  경주: "yeongnam",
  청주: "other",
  강릉: "other",
  익산: "other",
  순천: "other",
};

const CITY_GROUP_TO_TONE: Record<CityGroup, DataToneClass> = {
  metropolitan: "bg-pastel-lavender/40 text-foreground",
  metro_city: "bg-pastel-peach/40 text-foreground",
  yeongnam: "bg-pastel-mint/40 text-foreground",
  other: "bg-pastel-yellow/40 text-foreground",
};

const SCALE_TO_TONE: Partial<Record<string, DataToneClass>> = {
  large: "bg-pastel-peach/40 text-foreground",
  medium: "bg-pastel-yellow/40 text-foreground",
  small: "bg-pastel-lavender/40 text-foreground",
};

const CATEGORY_TO_TONE: Partial<Record<ChecklistItem["category"], DataToneClass>> = {
  hospital: "bg-pastel-peach/40 text-foreground",
  hospital_bag: "bg-pastel-peach/40 text-foreground",
  baby_items: "bg-pastel-mint/40 text-foreground",
  postpartum: "bg-pastel-lavender/40 text-foreground",
  admin: "bg-pastel-yellow/40 text-foreground",
};

const DASHBOARD_SLOT_TO_TONE: Record<DashboardSlot, DashboardSlotClass> = {
  checklist: "bg-pastel-pink/40 text-foreground",
  timeline: "bg-pastel-mint/40 text-foreground",
  weight: "bg-pastel-peach/40 text-foreground",
  info: "bg-pastel-lavender/40 text-foreground",
  babyfair: "bg-pastel-mint/40 text-foreground",
  video: "bg-pastel-yellow/40 text-foreground",
};

const DEFAULT_TONE: DataToneClass = "bg-pastel-lavender/40 text-foreground";

export function getCityTokenClass(city: string): DataToneClass {
  const group = CITY_TO_GROUP[city];
  return group ? CITY_GROUP_TO_TONE[group] : DEFAULT_TONE;
}

export function getScaleTokenClass(scale: string): DataToneClass {
  return SCALE_TO_TONE[scale] ?? DEFAULT_TONE;
}

export function getCategoryTokenClass(
  category: ChecklistItem["category"],
): DataToneClass {
  return CATEGORY_TO_TONE[category] ?? DEFAULT_TONE;
}

export function getDashboardIconBgClass(slot: DashboardSlot): DashboardSlotClass {
  return DASHBOARD_SLOT_TO_TONE[slot];
}
