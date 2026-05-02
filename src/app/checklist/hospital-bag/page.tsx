import type { Metadata } from "next";
import data from "@/data/hospital_bag_checklist.json";
import videos from "@/data/videos.json";
import { ChecklistPage } from "@/components/checklist/ChecklistPage";
import { getAllArticles } from "@/lib/articles";
import { BASE_URL, OG_IMAGE } from "@/lib/constants";
import type { ChecklistData } from "@/types/checklist";
import type { VideoItem } from "@/types/video";

const checklistData = data as ChecklistData;

export const metadata: Metadata = {
  title: `${checklistData.meta.title} - 출산 준비 체크리스트`,
  description: checklistData.meta.description,
  alternates: {
    canonical: `${BASE_URL}/checklist/${checklistData.meta.slug}`,
  },
  openGraph: {
    title: checklistData.meta.title,
    description: checklistData.meta.description,
    url: `${BASE_URL}/checklist/${checklistData.meta.slug}`,
    images: [OG_IMAGE],
  },
};

export default function HospitalBagChecklistPage() {
  const allArticles = getAllArticles();
  const linkedSlugs = new Set(checklistData.meta.linked_article_slugs ?? []);
  const linkedArticles = allArticles.filter((a) => linkedSlugs.has(a.slug));
  const linkedVideoIds = new Set(checklistData.meta.linked_video_ids ?? []);
  const linkedVideos = (videos as VideoItem[]).filter((v) => linkedVideoIds.has(v.id));

  return (
    <ChecklistPage
      data={checklistData}
      storeSlug="hospital-bag"
      linkedArticles={linkedArticles}
      linkedVideos={linkedVideos}
    />
  );
}
