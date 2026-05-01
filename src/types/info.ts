import type { ArticleMeta } from "@/types/article";
import type { VideoItem } from "@/types/video";

export type InfoArticleItem = {
  type: "article";
  data: ArticleMeta;
};

export type InfoVideoItem = {
  type: "video";
  data: VideoItem;
  channelName?: string;
};

export type InfoItem = InfoArticleItem | InfoVideoItem;

export type InfoTab = "all" | "articles" | "videos";
