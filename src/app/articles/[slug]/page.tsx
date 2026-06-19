import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllArticles,
  getArticleBySlug,
  faqAnswerToPlainText,
} from "@/lib/articles";
import {
  getRelatedArticles,
  getRelatedChecklists,
} from "@/lib/related-content";
import { ArticleDetail } from "@/components/articles/ArticleDetail";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { getBreadcrumbForPath } from "@/lib/breadcrumb-labels";
import { BASE_URL, OG_IMAGE } from "@/lib/constants";
import hospitalBag from "@/data/hospital_bag_checklist.json";
import partnerPrep from "@/data/partner_prep_checklist.json";
import pregnancyPrep from "@/data/pregnancy_prep_checklist.json";
import type { ChecklistData } from "@/types/checklist";
import type { Article, FaqItem } from "@/types/article";

const allChecklistMetas = [
  (hospitalBag as ChecklistData).meta,
  (partnerPrep as ChecklistData).meta,
  (pregnancyPrep as ChecklistData).meta,
];

function getArticleImageUrl(slug: string): string {
  const webpPath = path.join(process.cwd(), "public", "articles", `${slug}.webp`);
  if (fs.existsSync(webpPath)) {
    return `${BASE_URL}/articles/${slug}.webp`;
  }
  return `${BASE_URL}${OG_IMAGE.url}`;
}

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

type ArticleJsonLdProps = Pick<
  Article,
  | "title"
  | "description"
  | "canonical"
  | "date"
  | "updated"
  | "slug"
  | "tags"
  | "wordCount"
>;

function ArticleJsonLd({
  title,
  description,
  canonical,
  date,
  updated,
  slug,
  tags,
  wordCount,
}: ArticleJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: canonical,
    datePublished: date,
    ...(updated && { dateModified: updated }),
    image: getArticleImageUrl(slug),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
    ...(tags.length > 0 && {
      keywords: tags.join(", "),
      articleSection: tags[0],
    }),
    wordCount,
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

function FaqPageJsonLd({ faq }: { faq: FaqItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faqAnswerToPlainText(item.a),
      },
    })),
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

  return (
    <>
      <ArticleJsonLd
        title={article.title}
        description={article.description}
        canonical={article.canonical}
        date={article.date}
        updated={article.updated}
        slug={article.slug}
        tags={article.tags}
        wordCount={article.wordCount}
      />
      {article.faq && article.faq.length > 0 && (
        <FaqPageJsonLd faq={article.faq} />
      )}
      <BreadcrumbJsonLd
        items={getBreadcrumbForPath(`/articles/${article.slug}`, {
          title: article.title,
          slug: article.slug,
        })}
      />
      <ArticleDetail
        article={article}
        relatedArticles={relatedArticles}
        relatedChecklists={relatedChecklists}
      />
    </>
  );
}
