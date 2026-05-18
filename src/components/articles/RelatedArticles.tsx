import type { ArticleMeta } from "@/types/article";
import { ArticleCard } from "./ArticleCard";
import { sendGAEvent } from "@/lib/analytics";

interface RelatedArticlesProps {
  articles: ArticleMeta[];
  fromSlug: string;
}

export function RelatedArticles({ articles, fromSlug }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-base font-semibold mb-3">📰 관련 콘텐츠</h2>
      <div className="space-y-3">
        {articles.map((article, index) => (
          <ArticleCard
            key={article.slug}
            article={article}
            onAnalyticsClick={() =>
              sendGAEvent("related_article_click", {
                from_slug: fromSlug,
                to_slug: article.slug,
                position: index + 1,
                recommendation_type: "auto-crosslink",
              })
            }
          />
        ))}
      </div>
    </section>
  );
}
