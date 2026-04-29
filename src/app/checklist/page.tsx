import type { Metadata } from "next";
import hospitalBag from "@/data/hospital_bag_checklist.json";
import partnerPrep from "@/data/partner_prep_checklist.json";
import pregnancyPrep from "@/data/pregnancy_prep_checklist.json";
import checklistItems from "@/data/checklist_items.json";
import { ChecklistHub } from "@/components/checklist/ChecklistHub";
import { BASE_URL, OG_IMAGE } from "@/lib/constants";
import type { ChecklistData } from "@/types/checklist";

export const metadata: Metadata = {
  title: "체크리스트 - 출산 준비 체크리스트",
  description:
    "주차별 타임라인부터 출산가방·남편준비·임신준비까지, 임신·출산 전 과정을 빠짐없이 챙기는 체크리스트 모음.",
  alternates: {
    canonical: `${BASE_URL}/checklist`,
  },
  openGraph: {
    title: "체크리스트 - 출산 준비 체크리스트",
    description:
      "주차별 타임라인부터 출산가방·남편준비·임신준비까지, 임신·출산 전 과정을 빠짐없이 챙기는 체크리스트 모음.",
    url: `${BASE_URL}/checklist`,
    images: [OG_IMAGE],
  },
};

export default function ChecklistHubPage() {
  return (
    <ChecklistHub
      hospitalBag={hospitalBag as ChecklistData}
      partnerPrep={partnerPrep as ChecklistData}
      pregnancyPrep={pregnancyPrep as ChecklistData}
      timelineChecklistTotal={checklistItems.length}
    />
  );
}
