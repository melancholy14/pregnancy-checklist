import type { ArticleMeta } from "@/types/article";
import type { ChecklistMeta } from "@/types/checklist";
import type { VideoItem } from "@/types/video";
import { UNIFIED_TAGS } from "@/lib/unified-tags";

export function getRelatedArticles(
  current: ArticleMeta,
  all: ArticleMeta[],
  limit = 3,
): ArticleMeta[] {
  const others = all.filter((a) => a.slug !== current.slug);

  const scored = others
    .map((a) => {
      const intersect = a.tags.filter((t) => current.tags.includes(t)).length;
      const union = new Set([...a.tags, ...current.tags]).size;
      const score = union === 0 ? 0 : intersect / union;
      return { article: a, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (
        new Date(b.article.date).getTime() - new Date(a.article.date).getTime()
      );
    });

  const matched = scored
    .filter((s) => s.score > 0)
    .slice(0, limit)
    .map((s) => s.article);

  if (matched.length >= limit) return matched;

  const remaining = scored
    .filter((s) => s.score === 0)
    .slice(0, limit - matched.length)
    .map((s) => s.article);

  return [...matched, ...remaining];
}

export function getRelatedChecklists(
  articleSlug: string,
  checklists: ChecklistMeta[],
): ChecklistMeta[] {
  return checklists.filter((c) =>
    (c.linked_article_slugs ?? []).includes(articleSlug),
  );
}

export function getRelatedVideos(
  articleTags: string[],
  videos: VideoItem[],
  limit = 3,
): VideoItem[] {
  const matchedTags = UNIFIED_TAGS.filter((tag) =>
    articleTags.some((t) => tag.articleTags.includes(t)),
  );
  const categories = new Set(matchedTags.flatMap((t) => t.videoCategories));
  if (categories.size === 0) return [];

  return videos
    .filter((v) => categories.has(v.category))
    .sort(
      (a, b) =>
        new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime(),
    )
    .slice(0, limit);
}
