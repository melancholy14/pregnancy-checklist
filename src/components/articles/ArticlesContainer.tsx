"use client";

import { useState, useMemo } from "react";
import { ArticleCard } from "./ArticleCard";
import { TagFilter } from "./TagFilter";
import type { ArticleMeta } from "@/types/article";
import { PageDescription } from "@/components/common/PageDescription";

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
      <div className="pt-8">
        <h1 className="mb-2 text-center">정보 & 가이드</h1>
        <PageDescription>
          임신·출산·육아 각 단계에서 꼭 알아야 할 정보를 경험 기반으로
          정리했습니다. 태그 필터로 관심 주제만 골라 볼 수 있고, 각 글에는
          참고 자료 출처가 명시되어 있어 신뢰할 수 있는 정보를 제공합니다.
        </PageDescription>

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
