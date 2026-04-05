import type { Metadata } from "next";
import { getAllArticles, getAllTags } from "@/lib/articles";
import { ArticlesContainer } from "@/components/articles/ArticlesContainer";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "정보 & 가이드 - 출산 준비 체크리스트",
  description:
    "임신 초기 검사, 출산 준비물, 산후조리원 등 임신과 출산에 필요한 정보를 모았습니다.",
  alternates: {
    canonical: `${BASE_URL}/articles`,
  },
  openGraph: {
    title: "정보 & 가이드",
    description:
      "임신 초기 검사, 출산 준비물, 산후조리원 등 임신과 출산에 필요한 정보를 모았습니다.",
    url: `${BASE_URL}/articles`,
  },
};

export default function ArticlesPage() {
  const articles = getAllArticles();
  const allTags = getAllTags(articles);

  return <ArticlesContainer articles={articles} allTags={allTags} />;
}
