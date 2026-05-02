import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import {
  getRelatedArticles,
  getRelatedChecklists,
  getRelatedVideos,
} from "@/lib/related-content";
import { ArticleDetail } from "@/components/articles/ArticleDetail";
import { BASE_URL, OG_IMAGE } from "@/lib/constants";
import hospitalBag from "@/data/hospital_bag_checklist.json";
import partnerPrep from "@/data/partner_prep_checklist.json";
import pregnancyPrep from "@/data/pregnancy_prep_checklist.json";
import videos from "@/data/videos.json";
import type { ChecklistData } from "@/types/checklist";
import type { VideoItem } from "@/types/video";

const allChecklistMetas = [
  (hospitalBag as ChecklistData).meta,
  (partnerPrep as ChecklistData).meta,
  (pregnancyPrep as ChecklistData).meta,
];

export function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  return {
    title: `${article.title} - 출산 준비 체크리스트`,
    description: article.description,
    alternates: {
      canonical: article.canonical,
    },
    openGraph: {
      title: article.title,
      description: article.description,
      url: article.canonical,
      images: [OG_IMAGE],
    },
  };
}

function ArticleJsonLd({
  title,
  description,
  canonical,
  date,
  updated,
}: {
  title: string;
  description: string;
  canonical: string;
  date: string;
  updated?: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: canonical,
    datePublished: date,
    ...(updated && { dateModified: updated }),
    author: {
      "@type": "Person",
      name: "뿌까뽀까",
      url: `${BASE_URL}/about`,
    },
    publisher: {
      "@type": "Person",
      name: "뿌까뽀까",
      url: `${BASE_URL}/about`,
    },
    inLanguage: "ko-KR",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const allArticles = getAllArticles();
  const relatedArticles = getRelatedArticles(article, allArticles);
  const relatedChecklists = getRelatedChecklists(slug, allChecklistMetas);
  const relatedVideos = getRelatedVideos(article.tags, videos as VideoItem[]);

  return (
    <>
      <ArticleJsonLd
        title={article.title}
        description={article.description}
        canonical={article.canonical}
        date={article.date}
        updated={article.updated}
      />
      <ArticleDetail
        article={article}
        relatedArticles={relatedArticles}
        relatedChecklists={relatedChecklists}
        relatedVideos={relatedVideos}
      />
    </>
  );
}
