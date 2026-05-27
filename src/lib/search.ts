import Fuse from "fuse.js";
import type { TimelineItem } from "@/types/timeline";
import type { ArticleMeta } from "@/types/article";

export type SearchItemType = "timeline" | "article";

export type SearchItem = {
  type: SearchItemType;
  title: string;
  description: string;
  url: string;
  tags?: string[];
  week?: number;
};

export function buildSearchIndex(
  timelineItems: TimelineItem[],
  articles: ArticleMeta[],
): SearchItem[] {
  const timeline: SearchItem[] = timelineItems.map((item) => ({
    type: "timeline",
    title: `${item.week}주: ${item.title}`,
    description: item.description,
    url: `/timeline#timeline-week-${item.week}`,
    week: item.week,
  }));

  const articleItems: SearchItem[] = articles.map((a) => ({
    type: "article",
    title: a.title,
    description: a.description,
    url: `/articles/${a.slug}`,
    tags: a.tags,
  }));

  return [...timeline, ...articleItems];
}

export function createSearcher(items: SearchItem[]): Fuse<SearchItem> {
  return new Fuse(items, {
    keys: [
      { name: "title", weight: 2 },
      { name: "description", weight: 1 },
      { name: "tags", weight: 1.5 },
    ],
    threshold: 0.4,
    minMatchCharLength: 2,
  });
}
