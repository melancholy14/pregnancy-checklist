import type { Metadata } from "next";
import { HomeContent } from "@/components/home/HomeContent";
import { getAllArticles } from "@/lib/articles";
import { BASE_URL, OG_IMAGE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "출산 준비 체크리스트 - 초산 개발자가 직접 만든 임신 주차별 가이드",
  description: "답답해서 직접 만들었습니다. 임신 주차별 체크리스트, 입원가방, 베이비페어, 체중관리까지.",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "출산 준비 체크리스트 - 초산 개발자가 직접 만든 임신 주차별 가이드",
    description: "답답해서 직접 만들었습니다. 임신 주차별 체크리스트, 입원가방, 베이비페어, 체중관리까지.",
    url: BASE_URL,
    images: [OG_IMAGE],
  },
};

export default function Home() {
  const articles = getAllArticles().map(({ title, slug }) => ({ title, slug }));
  return <HomeContent articles={articles} />;
}
