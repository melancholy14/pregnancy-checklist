"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Article, ArticleMeta } from "@/types/article";
import type { ChecklistMeta } from "@/types/checklist";
import { TimelineCTA } from "./TimelineCTA";
import { MedicalDisclaimer } from "./MedicalDisclaimer";
import { RelatedArticles } from "./RelatedArticles";
import { RelatedContent } from "./RelatedContent";
import { ShareButton } from "@/components/share/ShareButton";
import { useScrollSignals } from "@/lib/use-scroll-signals";

interface ArticleDetailProps {
  article: Article;
  relatedArticles?: ArticleMeta[];
  relatedChecklists?: ChecklistMeta[];
}

export function ArticleDetail({
  article,
  relatedArticles = [],
  relatedChecklists = [],
}: ArticleDetailProps) {
  useScrollSignals("article", { slug: article.slug });
  return (
    <div className="min-h-screen pb-24 px-4">
      <article className="pt-8">
        <Link
          href="/articles"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 no-underline"
        >
          <ArrowLeft size={16} />
          목록으로
        </Link>

        <h1 className="mb-2">{article.title}</h1>
        <p className="text-muted-foreground text-sm mb-4">
          {article.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {article.tags.map((tag) => (
            <Badge
              key={tag}
              className="bg-pastel-lavender/30 text-accent-purple text-[11px] px-2 py-0.5 rounded-lg border-0 hover:bg-pastel-lavender/30"
            >
              #{tag}
            </Badge>
          ))}
        </div>
        <span className="text-xs text-muted-foreground block mb-6">
          <Link
            href="/about"
            className="text-muted-foreground hover:text-foreground no-underline"
          >
            뿌까뽀까
          </Link>
          {" · "}
          {article.date}
          {article.updated && article.updated !== article.date && (
            <> · 수정 {article.updated}</>
          )}
        </span>

        <div className="h-px bg-gradient-to-r from-transparent via-black/5 to-transparent mb-4" />

        <div className="flex justify-end mb-6">
          <ShareButton
            title={article.title}
            description={article.description}
            url={article.canonical}
            contentType="article"
            itemId={article.slug}
            position="top_right"
          />
        </div>

        {article.authorNote && (
          <div className="bg-pastel-yellow/20 border border-pastel-yellow/40 rounded-xl px-4 py-3.5 mb-8">
            <p className="text-xs font-medium text-accent-olive mb-1.5">
              💬 만든이의 한마디
            </p>
            <p className="text-sm text-accent-olive italic leading-relaxed">
              &ldquo;{article.authorNote}&rdquo;
            </p>
          </div>
        )}

        <MedicalDisclaimer text={article.disclaimer} />

        <div
          className="article-prose"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {article.faq && article.faq.length > 0 && (
          <section className="article-prose mt-8" aria-label="자주 묻는 질문">
            <h2>자주 묻는 질문</h2>
            {article.faq.map((item, i) => (
              <div key={i}>
                <h3>{item.q}</h3>
                <div
                  dangerouslySetInnerHTML={{
                    __html: article.faqHtmlAnswers?.[i] ?? "",
                  }}
                />
              </div>
            ))}
          </section>
        )}

        {article.linked_timeline_weeks && article.linked_timeline_weeks.length > 0 && (
          <TimelineCTA weeks={article.linked_timeline_weeks} />
        )}

        <div className="flex justify-center mt-10">
          <ShareButton
            title={article.title}
            description={article.description}
            url={article.canonical}
            contentType="article"
            itemId={article.slug}
            position="bottom_center"
            label="이 글 공유하기"
          />
        </div>

        <RelatedContent checklists={relatedChecklists} />

        <RelatedArticles articles={relatedArticles} fromSlug={article.slug} />
      </article>
    </div>
  );
}
