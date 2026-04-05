"use client";

import { useState, useMemo } from "react";
import { ArticleCard } from "./ArticleCard";
import { TagFilter } from "./TagFilter";
import type { ArticleMeta } from "@/types/article";

interface ArticlesContainerProps {
  articles: ArticleMeta[];
  allTags: string[];
}

export function ArticlesContainer({ articles, allTags }: ArticlesContainerProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredArticles = useMemo(() => {
    if (!selectedTag) return articles;
    return articles.filter((a) => a.tags.includes(selectedTag));
  }, [articles, selectedTag]);

  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="max-w-2xl mx-auto pt-8">
        <h1 className="mb-2 text-center">정보 & 가이드</h1>
        <p className="text-center text-muted-foreground mb-8">
          임신과 출산에 도움되는 정보 모음
        </p>

        <div className="mb-6">
          <TagFilter
            tags={allTags}
            selectedTag={selectedTag}
            onSelect={setSelectedTag}
          />
        </div>

        {filteredArticles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-5xl mb-4">📝</div>
            <p>해당 태그의 글이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
