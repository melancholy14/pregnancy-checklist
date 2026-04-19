import Fuse from "fuse.js";
import type { TimelineItem } from "@/types/timeline";
import type { ArticleMeta } from "@/types/article";
import type { VideoItem } from "@/types/video";

export type SearchItemType = "timeline" | "article" | "video";

export type SearchItem = {
  type: SearchItemType;
  title: string;
  description: string;
  url: string;
  tags?: string[];
  week?: number;
  categoryName?: string;
};

export function buildSearchIndex(
  timelineItems: TimelineItem[],
  articles: ArticleMeta[],
  videos: VideoItem[],
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

  const videoItems: SearchItem[] = videos.map((v) => ({
    type: "video",
    title: v.title,
    description: v.description ?? "",
    url: `/videos#${v.id}`,
    categoryName: v.categoryName,
  }));

  return [...timeline, ...articleItems, ...videoItems];
}

export function createSearcher(items: SearchItem[]): Fuse<SearchItem> {
  return new Fuse(items, {
    keys: [
      { name: "title", weight: 2 },
      { name: "description", weight: 1 },
      { name: "tags", weight: 1.5 },
      { name: "categoryName", weight: 1.2 },
    ],
    threshold: 0.4,
    minMatchCharLength: 2,
  });
}
