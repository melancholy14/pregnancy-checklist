"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Article } from "@/types/article";
import { TimelineCTA } from "./TimelineCTA";

interface ArticleDetailProps {
  article: Article;
}

export function ArticleDetail({ article }: ArticleDetailProps) {
  return (
    <div className="min-h-screen pb-24 px-4">
      <article className="pt-8">
        <Link
          href="/articles"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-[#3D4447] mb-6 no-underline"
        >
          <ArrowLeft size={16} />
          목록으로
        </Link>

        <h1 className="text-xl mb-2">{article.title}</h1>
        <p className="text-muted-foreground text-sm mb-4">
          {article.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {article.tags.map((tag) => (
            <Badge
              key={tag}
              className="bg-[#E4D6F0]/30 text-[#6B5A80] text-[11px] px-2 py-0.5 rounded-lg border-0 hover:bg-[#E4D6F0]/30"
            >
              #{tag}
            </Badge>
          ))}
        </div>
        <span className="text-xs text-muted-foreground block mb-6">
          {article.date}
          {article.updated && article.updated !== article.date && (
            <> · 수정 {article.updated}</>
          )}
        </span>

        <div className="h-px bg-gradient-to-r from-transparent via-[#F0EBE6] to-transparent mb-8" />

        {article.authorNote && (
          <div className="bg-[#FFF4D4]/15 border border-[#FFF4D4]/40 rounded-xl px-4 py-3.5 mb-8">
            <p className="text-xs font-medium text-[#8B7520] mb-1.5">
              💬 만든이의 한마디
            </p>
            <p className="text-sm text-[#8B7520] italic leading-relaxed">
              &ldquo;{article.authorNote}&rdquo;
            </p>
          </div>
        )}

        <div
          className="article-prose"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {article.linked_timeline_weeks && article.linked_timeline_weeks.length > 0 && (
          <TimelineCTA weeks={article.linked_timeline_weeks} />
        )}
      </article>
    </div>
  );
}
