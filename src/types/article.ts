export type ArticleMeta = {
  title: string;
  description: string;
  slug: string;
  tags: string[];
  date: string;
  updated?: string;
};

export type Article = ArticleMeta & {
  content: string;
};
