"use client";

import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import type { ArticleMeta } from "@/types/article";

interface RelatedArticlesLinkProps {
  articles: ArticleMeta[];
}

export function RelatedArticlesLink({ articles }: RelatedArticlesLinkProps) {
  if (articles.length === 0) return null;

  return (
    <div className="border-t border-black/4 px-4 py-3">
      <div className="flex items-center gap-1.5 mb-2">
        <FileText size={13} className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">관련 글</span>
      </div>
      <div className="space-y-1.5">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/articles/${article.slug}`}
            className="flex items-center gap-1 text-sm text-accent-purple hover:text-accent-purple-hover hover:bg-pastel-lavender/10 rounded-lg px-2 py-1.5 -mx-2 transition-colors no-underline"
          >
            <span className="flex-1 min-w-0">{article.title}</span>
            <ChevronRight size={16} aria-hidden="true" className="shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
