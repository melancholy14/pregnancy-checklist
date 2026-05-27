import type { Metadata } from "next";
import { ArticlesContainer } from "@/components/articles/ArticlesContainer";
import { getAllArticles } from "@/lib/articles";
import { BASE_URL, OG_IMAGE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "정보 & 가이드 - 출산 준비 체크리스트",
  description:
    "임신 초기 검사, 출산 준비물, 산후조리, 임산부 운동·영양 등 임신과 출산에 필요한 정보를 경험 기반으로 정리했습니다.",
  alternates: {
    canonical: `${BASE_URL}/articles`,
  },
  openGraph: {
    title: "정보 & 가이드 - 출산 준비 체크리스트",
    description:
      "임신·출산·육아 각 단계에서 꼭 알아야 할 정보를 한곳에서 탐색할 수 있어요.",
    url: `${BASE_URL}/articles`,
    images: [OG_IMAGE],
  },
};

export default function ArticlesPage() {
  const articles = getAllArticles();
  const allTags = Array.from(new Set(articles.flatMap((a) => a.tags))).sort();
  return <ArticlesContainer articles={articles} allTags={allTags} />;
}
