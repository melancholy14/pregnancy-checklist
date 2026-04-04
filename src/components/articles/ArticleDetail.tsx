"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Article } from "@/types/article";

interface ArticleDetailProps {
  article: Article;
}

export function ArticleDetail({ article }: ArticleDetailProps) {
  return (
    <div className="min-h-screen pb-24 px-4">
      <article className="max-w-2xl mx-auto pt-8">
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
        <span className="text-xs text-muted-foreground block mb-8">
          {article.date}
          {article.updated && article.updated !== article.date && (
            <> · 수정 {article.updated}</>
          )}
        </span>

        <div
          className="prose prose-sm max-w-none
            prose-headings:text-[#3D4447]
            prose-h2:text-base prose-h2:mt-8 prose-h2:mb-3
            prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2
            prose-p:text-sm prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-li:text-sm prose-li:text-muted-foreground prose-li:leading-relaxed
            prose-strong:text-[#3D4447]
            prose-a:text-[#6B5A80] prose-a:underline hover:prose-a:text-[#6B5A80]/80
            prose-blockquote:border-l-[#E4D6F0] prose-blockquote:text-sm prose-blockquote:text-muted-foreground
            prose-table:text-sm
            prose-th:text-left prose-th:font-medium prose-th:text-[#3D4447]
            prose-td:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>
    </div>
  );
}
