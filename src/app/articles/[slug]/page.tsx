import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import { ArticleDetail } from "@/components/articles/ArticleDetail";
import { BASE_URL, OG_IMAGE } from "@/lib/constants";

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

  return (
    <>
      <ArticleJsonLd
        title={article.title}
        description={article.description}
        canonical={article.canonical}
        date={article.date}
        updated={article.updated}
      />
      <ArticleDetail article={article} />
    </>
  );
}
