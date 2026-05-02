import type { ArticleMeta } from "@/types/article";
import { ArticleCard } from "./ArticleCard";

interface RelatedArticlesProps {
  articles: ArticleMeta[];
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-base font-semibold mb-3">📰 관련 콘텐츠</h2>
      <div className="space-y-3">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
}
