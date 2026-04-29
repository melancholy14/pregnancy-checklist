import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ArticleMeta } from "@/types/article";
import { sendGAEvent } from "@/lib/analytics";

interface ArticleCardProps {
  article: ArticleMeta;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link href={`/articles/${article.slug}`} className="no-underline block" onClick={() => sendGAEvent("content_click", { type: "article", title: article.title })}>
      <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-black/4 hover:-translate-y-0.5">
        <CardContent className="p-4">
          <h3 className="text-[15px] leading-snug mb-2">{article.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {article.description}
          </p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {article.tags.map((tag) => (
              <Badge
                key={tag}
                className="bg-pastel-lavender/30 text-accent-purple text-xs px-2 py-0.5 rounded-lg border-0 hover:bg-pastel-lavender/30"
              >
                #{tag}
              </Badge>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{article.date}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
