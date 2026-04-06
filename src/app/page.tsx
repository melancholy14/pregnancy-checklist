import type { Metadata } from "next";
import { HomeContent } from "@/components/home/HomeContent";
import { getAllArticles } from "@/lib/articles";
import { BASE_URL, OG_IMAGE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "출산 준비 체크리스트 - 임신 주차별 준비 가이드",
  description: "임신 주차에 맞춘 출산 준비 체크리스트, 타임라인, 베이비페어 일정을 한눈에 확인하세요.",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "출산 준비 체크리스트 - 임신 주차별 준비 가이드",
    description: "임신 주차에 맞춘 출산 준비 체크리스트, 타임라인, 베이비페어 일정을 한눈에 확인하세요.",
    url: BASE_URL,
    images: [OG_IMAGE],
  },
};

export default function Home() {
  const articles = getAllArticles().map(({ title, slug }) => ({ title, slug }));
  return <HomeContent articles={articles} />;
}
