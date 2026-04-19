export type ArticleMeta = {
  title: string;
  description: string;
  slug: string;
  tags: string[];
  date: string;
  updated?: string;
  linked_timeline_weeks?: number[];
  authorNote?: string;
  canonical: string;
};

export type Article = ArticleMeta & {
  content: string;
  disclaimer?: string;
};
